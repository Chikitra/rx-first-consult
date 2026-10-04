<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the consultation as the index route and its prescription preview client-side until patient and prescribing services are connected; the current project has no backend.
- Keep clinical context optional and secondary to medicines; the consultation must never gate prescription generation on documentation.
- Keep allergy status as three explicit patient-scoped browser states shared between Visit and Medicines until patient services are connected; unrecorded must never be inferred as no known allergies, and an established answer should not be asked again.
- Define consultation-section accent, ink, tint, and border colors by section in global CSS so tabs and active panels share one semantic identity without altering prescription actions.
- Keep medicine rows grouped by inferred comparison with the relevant repeated prescription, with chip-first editing in a sheet; calculate quantity only for parseable finite regimens, otherwise require an explicit override, to avoid unsafe inferred quantities.
- Investigations split: results in Visit, tests in Investigations → Tests & Advice.
