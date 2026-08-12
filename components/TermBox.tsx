export type Term = { term: string; definition: string };

export function TermBox({ terms, title = "Terim Köşesi" }: { terms: Term[]; title?: string }) {
  if (terms.length === 0) return null;

  return (
    <div className="term-box">
      <div className="kicker">{title}</div>
      <dl>
        {terms.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
