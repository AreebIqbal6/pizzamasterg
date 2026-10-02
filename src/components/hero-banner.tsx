import Image from "next/image"

export function HeroBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative h-[300px] w-full sm:h-[400px] md:h-[480px]">
        <Image src="/banner.jpg" alt="Pizza Master G - Karachi Ka Best Pizza" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-3xl px-4 pb-8 text-center sm:-mt-20">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-card ring-4 ring-accent sm:h-28 sm:w-28">
          <Image
            src="/chef-logo-removebg-preview.png"
            alt="Pizza Master G chef logo"
            width={96}
            height={96}
            className="h-20 w-20 rounded-full object-contain sm:h-24 sm:w-24"
          />
        </div>
        <h1 className="mt-4 text-balance font-sans text-3xl font-extrabold uppercase tracking-tight text-accent drop-shadow sm:text-5xl">
          Karachi Ka Best Pizza
        </h1>
        <p className="mt-2 text-pretty text-sm italic text-muted-foreground sm:text-base">
          Enjoy Pizza Master G — Nice to meet You
        </p>
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-lg border border-accent/40 bg-card px-5 py-3 text-sm font-extrabold sm:text-base">
          <span className="text-accent">SMALL 130</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-accent">REGULAR 350</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-accent">LARGE 500</span>
        </div>
      </div>
    </section>
  )
}
