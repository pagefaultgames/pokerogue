<!-- TODO: Find and replace "Pokemon" with "Pokémon" -->
# EnemyCommandPhase: How Enemy Pokémon Decide What to Do

## Step 1: Should the Enemy Pokémon Switch?

When battling an enemy Trainer, the first decision the enemy needs to make is whether or not to switch an active Pokémon with another Pokémon in their party. This decision is primarily made by comparing **matchup scores** between each Pokémon in the enemy's party.

### Calculating Matchup Scores

The core function for matchup score calculation can be found in [`src/field/pokemon.ts`](../src/field/pokemon.ts), within the `Pokemon` class:

```ts
getMatchupScore(pokemon: Pokemon): number;
```

This computes the source Pokémon's matchup score against the Pokemon passed by argument using the formula

$$\text{MUScore} = (\text{atkScore}+\text{defScore}) * \text{hpDiffRatio} $$

where
- $\text{atkScore}$ is the combined effectiveness of the source Pokemon's types against the opposing Pokemon's defensive typing: $\prod_{\text{types}} \text{typeEffectiveness}(\text{type}, \text{oppPokemon})$. $\text{typeEffectiveness}$ is 1 when the type deals neutral damage to the opposing Pokemon's defensive typing, 2 when the type deals super effective damage, and so on. $atkScore$ is also increased by 25 percent if the source Pokemon has a higher Speed stat than the opposing Pokemon.
- $\text{defScore}$ is the inverse of the opposing Pokemon's $\text{atkScore}$ against the source Pokemon's defensive typing, or $(\prod_{\text{types}} \text{typeEffectiveness}(\text{type}, \text{sourcePokemon}))^{-1}$. Unlike $\text{atkScore}$, $\text{defScore}$ is capped at a maximum score of 4.
- $\text{hpDiffRatio}= \text{sourceHpRatio}-\text{oppHpRatio}+1$. This is increased by 50 percent if the source Pokemon has a higher Speed stat than the opposing Pokemon; however, $\text{hpDiffRatio}$ cannot be higher than 1.

### Determining Switches in EnemyCommandPhase

The `EnemyCommandPhase` follows this process to determine whether or not an enemy Pokemon should switch on each turn during a Trainer battle.

1. If the Pokemon has a move already queued (e.g. they are recharging after using Hyper Beam), or they are trapped (e.g. by Bind or Arena Trap), skip to resolving a `FIGHT` command (see next section).
2. For each Pokemon in the enemy's party, [compute their matchup scores](#calculating-matchup-scores) against the active player Pokemon. If there are two active player Pokemon in the battle, add their matchup scores together.
3. Take the party member with the highest matchup score and apply a multiplier to the score that reduces the score based on how many times the trainer has already switched Pokemon this battle.
4. Compare the result of Step 3 with the active enemy Pokemon's matchup score. If the party member's matchup score is at least three times that of the active Pokemon, switch to that party member.
  - "Boss" trainers (e.g. the Rival fights and Champion) only require the party member's matchup score to be at least two times that of the active Pokemon, so they are more likely to switch than other trainers.
5. If the enemy decided to switch, send a switch `turnCommand` and end this `EnemyCommandPhase`; otherwise, move on to resolving a `FIGHT` enemy command.