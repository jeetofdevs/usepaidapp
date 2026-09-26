export function Lookup({ placeholder = "@handle or token address" }: { placeholder?: string }) {
  return (
    <form className="lookup" action="/lookup" method="get">
      <input name="q" placeholder={placeholder} aria-label="X handle or token address" autoComplete="off" required />
      <button className="btn" type="submit">
        Look up
      </button>
    </form>
  );
}
