"use client"

import type { ComponentProps } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export type CityDatum = {
  city: string
  providers: number
}

const chartConfig = {
  providers: {
    label: "Majstora",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function CitiesChart({
  data,
  className,
  ...props
}: ComponentProps<typeof Card> & { data: CityDatum[] }) {
  return (
    <Card
      className={cn("flex flex-col shadow-none dark:ring-0", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle>Pokrivenost po gradovima</CardTitle>
        <CardDescription>Broj registrovanih majstora po gradu</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer className="aspect-[22/8] w-full" config={chartConfig}>
            <BarChart
              data={data}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid className="stroke-border" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="city"
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ className: "tabular-nums" }}
                tickLine={false}
                tickMargin={8}
                width={28}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="providers" fill="var(--color-providers)" radius={6} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-muted-foreground text-sm">
            Još uvek nema dovoljno podataka.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
