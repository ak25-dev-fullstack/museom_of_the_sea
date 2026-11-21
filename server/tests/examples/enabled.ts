/**
 * @module tests/examples/enabled
 *
 * The example conversations that plain `npm test` (and so CI) runs. It starts empty, because
 * nothing is built yet. Each engine or API slice adds the ids of the examples it makes pass, in
 * its own pull request, so CI stays green and a passing example can't silently break later.
 *
 * `npm run test:examples` always runs **all** examples, whatever this list says.
 *
 * @example
 * export const enabledExamples: readonly string[] = ['01-start-visit', '02-exhibit-walkthrough'];
 */
export const enabledExamples: readonly string[] = [];
