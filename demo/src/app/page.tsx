import { Nav, GITHUB } from '@/components/Nav'
import { Hero } from '@/components/Hero'
import { Playground } from '@/components/Playground'
import { Gallery } from '@/components/Gallery'
import { MakeYourOwn } from '@/components/MakeYourOwn'
import { Api } from '@/components/Api'
import { ActivePalProvider } from '@/lib/active-pal'

export default function Home() {
  return (
    <ActivePalProvider>
      <Nav />
      <main>
        <Hero />
        <Playground />
        <Gallery />
        <MakeYourOwn />
        <Api />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>MIT licensed. Made by Rakshith Raj.</p>
          <p>
            Inspired by{' '}
            <a className="underline underline-offset-4 hover:text-ink" href="https://github.com/nilbuild/page-mascot">
              page-mascot
            </a>{' '}
            by Kamran Ahmed. <a className="underline underline-offset-4 hover:text-ink" href={GITHUB}>Source on GitHub</a>.
          </p>
        </div>
      </footer>
    </ActivePalProvider>
  )
}
