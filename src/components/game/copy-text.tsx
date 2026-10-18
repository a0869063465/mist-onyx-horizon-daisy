import { useEffect, useRef } from "react";
import { applyCopySize, loadCopySize, parseCopy } from "@/lib/copy-mark";
import { tr, useLang } from "@/lib/i18n";
import { noticeParts } from "@/components/game/painted";
import { sheetInk } from "@/components/game/sheet-ink";

export function CopySize() {
  useEffect(() => {
    const sync = () => applyCopySize(loadCopySize());
    sync();
    window.addEventListener("clash-copy-size", sync);
    return () => window.removeEventListener("clash-copy-size", sync);
  }, []);
  return null;
}

/**
 * `inked`: plain words that stand out (monster names, skills, damage kinds…) take the notice board's colours,
 * plus the monster sheet's own colours for stats, turns, healing and the like.
 */
export function CopyText({ text, firstTitle = true, inked = false }: { text: string; firstTitle?: boolean; inked?: boolean }) {
  useLang();
  const bits = parseCopy(tr(text), firstTitle);
  const nodes = [];
  for (let index = 0; index < bits.length; index += 1) {
    const bit = bits[index];
    if (!bit) continue;
    if ("br" in bit) {
      nodes.push(<br key={index} />);
      continue;
    }
    const next = bits[index + 1];
    const colon = next && !("br" in next) && !next.bold && !next.under && /^[:：]\s*$/.test(next.text) ? next.text : "";
    if ((bit.bold || bit.under) && colon) {
      const cut = /^(.*?)(\S+)$/.exec(bit.text);
      const lead = cut?.[1] ?? "";
      const tail = cut?.[2] ?? bit.text;
      const mark = (value: string) => {
        const body = bit.bold ? <strong>{value}</strong> : value;
        return bit.under ? <u>{body}</u> : body;
      };
      nodes.push(
        <span key={index}>
          {lead ? mark(lead) : null}
          <span className="copy-keep">
            {mark(tail)}
            {colon}
          </span>
        </span>,
      );
      index += 1;
      continue;
    }
    if (inked && !bit.bold && !bit.under) {
      nodes.push(
        <span key={index}>
          {noticeParts(bit.text, false, true, sheetInk).map((part, at) => (part.ink ? <b key={at} className={`ink-${part.ink}`}>{part.text}</b> : <span key={at}>{part.text}</span>))}
        </span>,
      );
      continue;
    }
    const body = bit.bold ? <strong>{bit.text}</strong> : bit.text;
    nodes.push(bit.under ? <u key={index}>{body}</u> : <span key={index}>{body}</span>);
  }
  return <>{nodes}</>;
}

export function CopyEdit({
  label,
  value,
  onChange,
  sized = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sized?: boolean;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  function wrap(mark: "**" | "__") {
    const node = box.current;
    if (!node) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    if (start === end) return;
    const selected = value.slice(start, end);
    const before = value.slice(Math.max(0, start - mark.length), start);
    const after = value.slice(end, end + mark.length);
    let next = value;
    let from = start;
    let to = end;
    if (before === mark && after === mark) {
      next = value.slice(0, start - mark.length) + selected + value.slice(end + mark.length);
      from = start - mark.length;
      to = end - mark.length;
    } else if (selected.startsWith(mark) && selected.endsWith(mark) && selected.length > mark.length * 2) {
      const inner = selected.slice(mark.length, -mark.length);
      next = value.slice(0, start) + inner + value.slice(end);
      to = start + inner.length;
    } else {
      const wrapped = `${mark}${selected}${mark}`;
      next = value.slice(0, start) + wrapped + value.slice(end);
      to = start + wrapped.length;
    }
    onChange(next);
    window.requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(from, to);
    });
  }
  function wrapBoth() {
    const node = box.current;
    if (!node) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    if (start === end) return;
    const open = "__**";
    const close = "**__";
    const selected = value.slice(start, end);
    const before = value.slice(Math.max(0, start - open.length), start);
    const after = value.slice(end, end + close.length);
    let next = value;
    let from = start;
    let to = end;
    if (before === open && after === close) {
      next = value.slice(0, start - open.length) + selected + value.slice(end + close.length);
      from = start - open.length;
      to = end - open.length;
    } else if (selected.startsWith(open) && selected.endsWith(close) && selected.length > open.length + close.length) {
      const inner = selected.slice(open.length, -close.length);
      next = value.slice(0, start) + inner + value.slice(end);
      to = start + inner.length;
    } else {
      const wrapped = `${open}${selected}${close}`;
      next = value.slice(0, start) + wrapped + value.slice(end);
      to = start + wrapped.length;
    }
    onChange(next);
    window.requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(from, to);
    });
  }
  return (
    <div className={`tune-field-label copy-edit${sized ? " is-skill" : ""}`}>
      {label}
      <span className="copy-tools">
        {sized ? (
          <button type="button" className="is-mark" onMouseDown={(event) => event.preventDefault()} onClick={wrapBoth}>
            Đậm và gạch chân
          </button>
        ) : (
          <>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => wrap("**")}>
              Đậm
            </button>
            <button type="button" className="is-under" onMouseDown={(event) => event.preventDefault()} onClick={() => wrap("__")}>
              Gạch chân
            </button>
          </>
        )}
      </span>
      <textarea ref={box} className="tune-input is-area" value={value} onChange={(event) => onChange(event.target.value)} />
      <p className="ink-skill copy-preview">
        <CopyText text={value} />
      </p>
    </div>
  );
}