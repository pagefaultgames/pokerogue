# EnemyCommandPhase: How Enemy Pokémon Decide What to Do

## Step 1: Should the Enemy Pokémon Switch?

When battling an enemy Trainer, the first decision the enemy needs to make is whether or not to switch an active Pokémon with another Pokémon in their party. This decision is primarily made by comparing **matchup scores** between each Pokémon in the enemy's party.

### Calculating Matchup Scores

The core function for matchup score calculation can be found in `src/field/pokemon.ts`, within the `Pokemon` class:

```ts
getMatchupScore(pokemon: Pokemon): number;
```

This computes the source Pokémon's matchup score against the Pokémon passed by argument using the formula

$$\text{MUScore} = (\text{atkScore}+\text{defScore}) * \text{hpDiffRatio} $$

where
- $\text{atkScore}$ is the combined effectiveness of the source Pokémon's types against the opposing Pokémon's defensive typing: $\prod_{\text{types}} \text{typeEffectiveness}(\text{type}, \text{oppPokemon})$. $\text{typeEffectiveness}$ is 1 when the type deals neutral damage to the opposing Pokémon's defensive typing, 2 when the type deals super effective damage, and so on. $atkScore$ is also increased by 25 percent if the source Pokémon has a higher Speed stat than the opposing Pokémon.
- $\text{defScore}$ is the inverse of the opposing Pokémon's $\text{atkScore}$ against the source Pokémon's defensive typing, or $(\prod_{\text{types}} \text{typeEffectiveness}(\text{type}, \text{sourcePokemon}))^{-1}$. Unlike $\text{atkScore}$, $\text{defScore}$ is capped at a maximum score of 4.
- $\text{hpDiffRatio}= \text{sourceHpRatio}-\text{oppHpRatio}+1$. This is further multiplied by 1.5 if the source Pokémon has a higher Speed stat than the opposing Pokémon; however, $\text{hpDiffRatio}$ cannot be higher than 1.

### Determining Switches in EnemyCommandPhase

The `EnemyCommandPhase` follows this process to determine whether or not an enemy Pokémon should switch on each turn during a Trainer battle.

1. If the Pokémon has a move already queued (e.g. they are recharging after using Hyper Beam), or they are trapped (e.g. by Bind or Arena Trap), skip to resolving a `FIGHT` command (see next section).
2. For each Pokémon in the enemy's party, [compute their matchup scores](#calculating-matchup-scores) against the active player Pokémon. If there are two active player Pokémon in the battle, add their matchup scores together.
3. Take the party member with the highest matchup score and apply a multiplier to the score that reduces the score based on how frequently the enemy trainer has switched Pokémon in the current battle.
   - The multiplier scales off of a counter that increments when the enemy trainer chooses to switch a Pokémon and decrements when they choose to use a move.
4. Compare the result of Step 3 with the active enemy Pokémon's matchup score. If the party member's matchup score is at least three times that of the active Pokémon, switch to that party member.
   - "Boss" trainers (e.g. the Rival fights and Champion) only require the party member's matchup score to be at least two times that of the active Pokémon, so they are more likely to switch than other trainers.
5. If the enemy decided to switch, send a switch `turnCommand` and end this `EnemyCommandPhase`; otherwise, move on to resolving a `FIGHT` enemy command.

## Step 2: Selecting a Move

At this point, the enemy (a wild or trainer Pokémon) has decided against switching and instead will use a move from its moveset. However, it still needs to figure out which move to use and, if applicable, which target to use the move against. The logic for determining an enemy's next move and target is contained within two methods: `EnemyPokemon.getNextMove()` and `EnemyPokemon.getNextTargets()` in `src/field/pokemon.ts`.

### Choosing a Move with `getNextMove()`

In `getNextMove()`, the enemy Pokémon chooses a move to use in the following steps:
1. If the Pokémon has a move in its Move Queue (e.g. the second turn of a charging move), and the queued move is still usable, use that move against the given target.
2. Filter out any moves it can't use within its moveset. The remaining moves make up the enemy's **move pool** for the turn.
   1. A move can be unusable if it has no PP left or it has been disabled by another move or effect
   2. If the enemy's move pool is empty, use Struggle.
3. Calculate the **move score** of each move in the enemy's move pool.
   1. A move's move score is equivalent to the move's maximum **target score** among all of the move's possible targets on the field ([more on this later](#calculating-move-and-target-scores)).
   2. A move's move score is set to -20 if at least one of these conditions are met:
      - The move is unimplemented (or, more precisely, the move's name ends with "&nbsp;(N)").
      - Conditions for the move to succeed are not met (unless the move is Sucker Punch, Upper Hand, or Thunderclap, as those moves' conditions can't be resolved before the turn starts).
      - The move's target scores are 0 or `NaN` for each target. In this case, the game assumes the target score calculation for that move is unimplemented.
4. Sort the move pool in descending order of move scores.
5. From here, the enemy's move selection varies based on its `aiType`. If the enemy is a Boss Pokémon or has a Trainer, it uses the `SMART` AI type; otherwise, it uses the `SMART_RANDOM` AI type.
   1. Let $m_i$ be the *i*-th move in the sorted move pool $M$:
      - If `aiType === SMART_RANDOM`, the enemy has a 5/8 chance of selecting $m_0$ and a 3/8 chance of advancing to the next best move $m_1$, where it then repeats this roll. This process stops when a move is selected or the last move in the move pool is reached.
      - If `aiType === SMART`, a similar loop is used to decide between selecting the move $m_i$ and advancing to the next iteration with the move $m_{i+1}$. However, instead of using a flat probability, the following conditions need to be met to advance from selecting $m_i$ to $m_{i+1}$:
        - $\text{sign}(s_i) = \text{sign}(s_{i+1})$, where $s_i$ is the move score of $m_i$.
        - $\text{randInt}(0, 100) < \text{round}(\frac{s_{i+1}}{s_i}\times 50)$. In other words: if the scores of $m_i$ and $m_{i+1}$ have the same sign, the chance to advance to the next iteration with $m_{i+1}$ is proportional to how close the scores are to each other. The probability to advance to the next iteration is at most 50 percent (when $s_i$ and $s_{i+1}$ are equal).
6. The enemy will use the move selected in Step 5 against the target(s) with the highest **target score** from Step 3.1

### Calculating Move and Target Scores

As part of the move selection process, the enemy Pokémon must compute a **target score (TS)** for each legal target for each move in its move pool. The base target score for all moves is a combination of the move's **user benefit score (UBS)** and **target benefit score (TBS)**.

$$\text{TS(move, target)}=\text{UBS}+\text{TBS} \times \begin{cases} -1 && \text{if target is an opponent}\\ 1 && \text{otherwise} \end{cases}$$

A move's UBS and TBS are computed with the respective functions in the `Move` class:

```ts
getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer;
getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer;
```

Logically, these functions are very similar &ndash; they add up their respective benefit scores from each of the move's attributes (as determined by `attr.getUserBenefitScore`, and `attr.getTargetBenefitScore`, respectively) and return the total benefit score. However, there are two key functional differences in how the UBS and TBS of a move are handled:
1. In addition to influencing move selection, a move's TBS also influences target selection for that move, whereas UBS has no influence.
2. When evaluating the target score of a move against an opposing Pokémon, the move's TBS is multiplied by -1, whereas the move's UBS does not change. For this reason, move attributes return negative values for their TBS to reward using the move against an enemy.

#### Calculating Target Benefit Score (TBS) for Attack Moves

In addition to the base score from `Move.getTargetBenefitScore()`, attack moves calculate an `attackScore` which influences the move's TBS based on the following properties:
- The move's power (after the move's `VariablePowerAttrs` are applied)
- The move's type effectiveness against the target (note that this also accounts for type immunities from abilities such as Levitate and field effects such as Strong Winds).
- The move's category (Physical/Special), and whether the user has a higher Attack or Special Attack stat.

More specifically, the following steps are taken to compute the move's `attackScore`:
1. Compute a multiplier based on the move's type effectiveness: 

   $\text{typeMult}=\begin{cases} 
     2  && \text{if move is super effective (or better)}\\
     -2 && \text{otherwise}
   \end{cases}$
2. Compute a multiplier based on the move's category and the user's offensive stats:
   1. Compute 
      $\text{statRatio}=\begin{cases}
        \frac{\text{userSpAtk}}{\text{userAtk}} && \text{if move is physical}\\
        \frac{\text{userAtk}}{\text{userSpAtk}} && \text{otherwise}
      \end{cases}$
   2. Compute the stat-based multiplier:

      $\text{statMult}=\begin{cases}
        2   && \text{if statRatio}\le 0.75\\
        1.5 && \text{if }0.75 < \text{statRatio}\le 0.875\\
        1   && \text{otherwise}
      \end{cases}$
3. Calculate the move's `attackScore`:

   $\text{attackScore} = (\text{typeMult}\times \text{statMult})+\lfloor \frac{\text{power}}{5} \rfloor$

The attack move's total TBS, then, is $\text{TBS}=\text{baseScore}-\text{attackScore}$, where $\text{baseScore}$ is the result of `Move.getTargetBenefitScore()`.

#### Calculating Target Score (TS) for Attack Moves

The final step to calculate an attack move's target score (TS) is to multiply the base target score by the move's type effectiveness and STAB (if it applies):
- If the target is an enemy, the corresponding TS is multiplied by the move's type effectiveness against the enemy (e.g. 2 if the move is super effective), then by 1.5 if the move shares a type with the user.
- If the target is an ally, the TS is divided by these factors instead.
- If $\text{TS}=0$ after these multipliers are applied, the TS is set to -20 for the current target.

### Choosing Targets with `getNextTargets()`

The enemy's target selection for single-target moves works in a very similar way to its move selection. Each potential target is given a **target selection score (TSS)** which is based on the move's [target benefit score](#calculating-move-and-target-scores) for that target:

$$\text{TSS} = \text{TBS} \times \begin{cases} -1 && \text{if target is an opponent} \\ 1 && \text{otherwise} \end{cases}$$

Once the TSS is calculated for each target, the target is selected as follows:
1. Sort the targets (indexes) in decreasing order of their target selection scores (or weights). Let $t_i$ be the index of the *i*-th target in the sorted list, and let $w_i$ be that target's corresponding TSS.
2. Normalize the weights. Let $w_n$ be the lowest-weighted target in the sorted list, then:
   
   $W_i=\begin{cases}
     w_i + |w_n| && \text{if } w_n \text{ is negative}\\
     w_i && \text{otherwise}
   \end{cases}$
3. Remove all weights from the list such that $W_i < \frac{W_0}{2}$
4. Generate a random integer $R=\text{rand}(0, W_{\text{total}})$ where $W_{\text{total}}$ is the sum of all the remaining weights after Step 3.
5. For each target $(t_i, W_i)$,
   1. if $R \le \sum_{j=0}^{i} W_i$, or if $t_i$ is the last target in the list, **return** $t_i$
   2. otherwise, advance to the next target $t_{i+1}$ and repeat this check.

Once the target is selected, the enemy has successfully determined its next action for the turn, and its corresponding `EnemyCommandPhase` ends. From here, the `TurnStartPhase` processes the enemy's commands alongside the player's commands and begins to resolve the turn.