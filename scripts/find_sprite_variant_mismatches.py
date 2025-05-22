"""
Validates the contents of the variant's masterlist file and identifies
any mismatched entries for the sprite of the same key between front, back, exp, exp back, and female.

This will create a csv file that contains all of the entries with mismatches.

An empty entry means that there was not a mismatch for that version of the sprite (meaning it matches front).
"""

import sys

if sys.version_info < (3, 7):
    msg = "This script requires Python 3.7+"
    raise RuntimeError(msg)

import json
import os
import csv
from dataclasses import dataclass, field
from typing import Literal as L

MASTERLIST_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "public", "images", "pokemon", "variant", "_masterlist.json"
)
EXP_MASTERLIST_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "public", "images", "pokemon", "variant", "_exp_masterlist.json"
)
DEFAULT_OUTPUT_PATH = "sprite-mismatches.csv"


@dataclass(order=True)
class Sprite:
    key: str = field(compare=False)
    front: list[int] = field(default_factory=list, compare=False)
    back: list[int] = field(default_factory=list, compare=False)
    female: list[int] = field(default_factory=list, compare=False)
    exp: list[int] = field(default_factory=list, compare=False)
    expback: list[int] = field(default_factory=list, compare=False)
    sortedKey: tuple[int] | tuple[int, str] = field(init=False, repr=False, compare=True)

    def as_row(self) -> tuple[str, list[int] | L[""], list[int] | L[""], list[int] | L[""], list[int] | L[""], list[int] | L[""]]:
        """return sprite information as a tuple for csv writing"""
        return (self.key, self.front or "", self.back or "", self.exp or "", self.expback or "", self.female or "")

    def is_mismatch(self) -> bool:
        """return True if the female, back, or exp sprites do not match the front"""
        for val in [self.back, self.exp, self.expback, self.female]:
            if val != [] and val != self.front:
                return True
        return False

    def __post_init__(self):
        split = self.key.split("-", maxsplit=1)
        self.sortedKey = (int(split[0]), split[1]) if len(split) == 2 else (int(split[0]),)


def make_mismatch_sprite_list(path):
    with open(path, "r") as f:
        masterlist: dict = json.load(f)

    # Go through the keys in "front" and "back" and make sure they match the masterlist
    back_data: dict[str, list[int]] = masterlist.pop("back", {})
    exp_data: dict[str, list[int]] = masterlist.pop("exp", {})
    exp_back_data: dict[str, list[int]] = exp_data.get("back", [])
    female_data: dict[str, list[int]] = masterlist.pop("female", {})

    sprites: list[Sprite] = []

    for key, item in masterlist.items():
        sprite = Sprite(
            key, front=item, back=back_data.get(key, []), exp=exp_data.get(key, []), expback=exp_back_data.get(key, []), female=female_data.get(key, [])
        )
        if sprite.is_mismatch():
            sprites.append(sprite)

    return sprites


def write_mismatch_csv(filename: str, mismatches: list[Sprite]):
    with open(filename, "w", newline="") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["key", "front", "back", "exp", "expback", "female"])
        for sprite in sorted(mismatches):
            writer.writerow(sprite.as_row())


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser("find_sprite_variant_mismatches", description=__doc__)

    p.add_argument(
        "-o",
        "--output",
        default=DEFAULT_OUTPUT_PATH,
        help=f"The path to a file to save the output file. If not specified, will write to {DEFAULT_OUTPUT_PATH}.",
    )
    p.add_argument("--masterlist", default=MASTERLIST_PATH, help=f"The path to the masterlist file to validate. Defaults to {MASTERLIST_PATH}.")
    p.add_argument("--exp-masterlist", default=EXP_MASTERLIST_PATH, help=f"The path to the exp masterlist file to validate against. Defaults to {EXP_MASTERLIST_PATH}.")
    args = p.parse_args()
    mismatches = make_mismatch_sprite_list(args.masterlist)
    write_mismatch_csv(args.output, mismatches)
