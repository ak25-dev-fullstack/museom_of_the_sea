# Example generator tools

The scripts that produce the example conversations in `../NN-*.md`. Facts, event names and list
contents are copied from `../../research/events.csv` by code, never typed by hand, so the
examples stay word for word (room `CLAUDE.md`).

They need **Python 3** (standard library only, no packages to install).

| Script                 | What it does                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `generate_examples.py` | Holds every example's data and writes `../01-…md` to `../18-…md`                                  |
| `check_examples.py`    | Checks the written examples against the CSV; exits 1 on any mismatch                              |
| `matcher.py`           | A Python **reference** version of the spec's matching rules (§6), used to work out expected picks |

## Regenerating the examples

From the repo root:

```sh
python3 docs/rooms/changing-sea/examples/tools/generate_examples.py
npm run format
python3 docs/rooms/changing-sea/examples/tools/check_examples.py
npm run test:examples   # the runner reads the regenerated files
```

CI runs `check_examples.py` on every push and pull request (`.github/workflows/ci.yml`), so a fact
that doesn't match the CSV fails the build. `npm run format` is needed because the generator's
markdown isn't Prettier-formatted. Regenerating
without data changes gives byte-identical files.

## Changing an example

Edit the example's data in `generate_examples.py` and regenerate. **Don't hand-edit the `.md`
files**: the next run overwrites them. To try a question first:

```sh
python3 docs/rooms/changing-sea/examples/tools/matcher.py "What hurricanes happened in 2020?"
python3 docs/rooms/changing-sea/examples/tools/matcher.py "list what happened in 2020" ice-poles
```

## Keep the matcher in step with the spec

`matcher.py` is **not** the engine. The engine is TypeScript in `server/src/engine/`. The matcher
only computes what the examples should expect. If the matching rules (§6) or the starting lexicon
(§12.2) change in the spec, update `matcher.py` too and regenerate, or the examples will expect
the old behaviour.
