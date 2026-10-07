import { Code } from './Code'

const attrs: [string, string, string][] = [
  ['poses', 'required', 'URL of the poses sheet'],
  ['moods', 'required', 'URL of the moods sheet'],
  ['size', '140', 'Width and height in px'],
  ['label', '"mascot"', 'Used in the accessible name, "Poke the {label}"'],
  ['sleep-after', '15000', 'ms without activity before it naps. 0 never naps'],
  ['watch-fields', 'on', 'Set to "off" to stop it looking at focused inputs'],
  ['celebrate-on-submit', 'on', 'Set to "off" to stop it celebrating form submits'],
]

const react = `import { PeekPal } from 'peekpal/react'

<PeekPal
  poses="/pals/cat-poses.webp"
  moods="/pals/cat-moods.webp"
  size={140}
/>`

const methods = `const pal = document.querySelector('peek-pal')

pal.react('love')          // any mood, 600 ms by default
pal.lookAt(x, y)           // page coordinates
pal.lookAt(null)           // back to the cursor

pal.addEventListener('peekpal:poke', (e) => e.detail.count)
pal.addEventListener('peekpal:sleep', nap)
pal.addEventListener('peekpal:wake', hello)`

export function Api() {
  return (
    <section id="api" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">API</h2>
      <div className="mt-10 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Attribute</th>
              <th scope="col" className="px-6 py-4 font-semibold">Default</th>
              <th scope="col" className="px-6 py-4 font-semibold">What it does</th>
            </tr>
          </thead>
          <tbody>
            {attrs.map(([name, def, what]) => (
              <tr key={name} className="border-b border-line last:border-0">
                <td className="px-6 py-3 font-mono text-[13px] font-medium">{name}</td>
                <td className="px-6 py-3 font-mono text-[13px] text-muted">{def}</td>
                <td className="px-6 py-3">{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Code code={methods} label="methods and events" />
        <Code code={react} label="react / next.js" />
      </div>
      <p className="mt-6 text-muted">
        On its own it also watches the page: it looks at the field you are typing in, turns away from password fields and
        celebrates when a form is submitted. Touch screens get a still, centred pal that still answers taps, and reduced
        motion turns off the bounce and the breathing.
      </p>
    </section>
  )
}
