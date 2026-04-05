import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">ClearMyPlate</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Family meal planning made simple. Plan the week, clear the plate.
      </p>
      <div className="flex gap-4">
        <Button size="lg">Get Started</Button>
        <Button size="lg" variant="outline">Learn More</Button>
      </div>
    </main>
  )
}
