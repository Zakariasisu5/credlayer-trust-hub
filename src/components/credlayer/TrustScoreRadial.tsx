import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

export function TrustScoreRadial({ score }: { score: number }) {
  const data = [{ name: "score", value: score, fill: "var(--electric)" }];
  return (
    <div className="relative h-48 w-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "var(--muted)" }} dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold">{score}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Trust Score</div>
      </div>
    </div>
  );
}
