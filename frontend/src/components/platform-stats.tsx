import { MapPin, Star, ThumbsUp, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Stat = {
  label: string
  value: string
  footnote: string
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon
  return (
    <Card className={cn("shadow-none dark:ring-0")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-muted-foreground text-xs">
          {stat.label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="font-semibold text-3xl tabular-nums">{stat.value}</p>
        <span className="text-muted-foreground text-xs">{stat.footnote}</span>
      </CardContent>
    </Card>
  )
}

export function PlatformStats({
  providers,
  reviews,
  cities,
  avgRating,
}: {
  providers: number
  reviews: number
  cities: number
  avgRating: number | null
}) {
  const stats: Stat[] = [
    {
      label: "Majstori i pružaoci usluga",
      value: providers.toLocaleString("sr-Latn"),
      footnote: "Registrovanih na platformi",
      icon: Wrench,
    },
    {
      label: "Zadovoljni korisnici",
      value: reviews.toLocaleString("sr-Latn"),
      footnote: "Ostavljenih recenzija",
      icon: ThumbsUp,
    },
    {
      label: "Prosječna ocjena",
      value: avgRating != null ? avgRating.toFixed(1) : "—",
      footnote: "Na osnovu svih recenzija",
      icon: Star,
    },
    {
      label: "Gradovi",
      value: cities.toLocaleString("sr-Latn"),
      footnote: "Pokrivenost u regionu",
      icon: MapPin,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.label} stat={s} />
      ))}
    </div>
  )
}
