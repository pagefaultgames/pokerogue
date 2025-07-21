import z from "zod";

/*
Schema for session data
*/

/*
Schema of a `PokemonMove` as of version 1.10
*/

// const IVSet = z.tuple([IVSchema, IVSchema, IVSchema, IVSchema, IVSchema, IVSchema]).catch((e) => {
//   e.value
// }

export const Z$NonNegativeCatchNeg1 = /*@__PURE__*/ z
  .int()
  .nonnegative()
  .optional()
  .catch(-1);

console.log(Z$NonNegativeCatchNeg1.safeParse(undefined));

// export const PokemonMoveSchema = z.object({
//   moveId: z.number().int().min(0).optional().overwrite(() => 15), // Move ID, default to 0
//   ppUsed: z.number().int().catch(0), // PP used, default to 0
//   ppUp: z.number().int().default(0).catch(0), // PP Up count, default to 0
//   maxPpOverride: z.int().min(1).optional(), // Optional max PP override, can be null
// });

// // export const PokemonDataSchema = z.object({
// //     id: z.int(),
// //     player: z.boolean(),
// //     species: z.int(),
// //     nickname: z.string(),
// //     formIndex: z.int().default(0),
// //     abilityIndex: z.int().min(0).max(2).default(0).catch,
// // }).check(data => {
// //     // clamp form index to be between 0 and the max form index for the species
// //     const species = getPokemonSpecies(data.value.species);
// //     // Clamp formindex to be between 0 and the max form index for the species

// // })

// const mockData = {
//   // ppUsed: 5,
//   ppUp: 2,
//   iv: [1, 15, 14, 14, 15, 16, 17]
// };

// try {
//   // Parse and validate the mock data
//   const result = PokemonMoveSchema.parse(mockData);
//   console.log("Validation successful:", result);
// } catch (error: unknown) {
//   if (error instanceof ZodError) {
//     console.error(error.message);
//     console.error(z.treeifyError(error));
//   } else {
//     console.error("Validation failed:", error);
//   }
// }
