"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/contexts/AppContext"

interface FMEA {
  id: string
  name: string
  asset_type: string
  created_at: string
  data: any
}

export function FMEAComparison({ fmeas }: { fmeas: FMEA[] }) {
  const { selectedFMEAs } = useAppContext()

  if (fmeas.length < 2) {
    return (
      <Card>
        <CardContent>
          <p className="py-4">Please select at least 2 FMEAs to compare.</p>
        </CardContent>
      </Card>
    )
  }

  // Extract failure modes from all FMEAs
  const allFailureModes = fmeas.flatMap(
    (fmea) =>
      fmea.data?.failureModes?.map((mode) => ({
        ...mode,
        fmeaId: fmea.id,
        fmeaName: fmea.name,
      })) || [],
  )

  // Calculate max RPN and cost for scaling
  const maxRPN = Math.max(...allFailureModes.map((mode) => mode.rpn || 0))
  const maxCost = Math.max(...allFailureModes.map((mode) => mode.totalCost || 0))

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Weibull Parameters Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FMEA</TableHead>
                <TableHead>Shape (β)</TableHead>
                <TableHead>Scale (η)</TableHead>
                <TableHead>MTBF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fmeas.map((fmea) => (
                <TableRow key={fmea.id}>
                  <TableCell>{fmea.name}</TableCell>
                  <TableCell>{fmea.data?.weibullParams?.shape || "N/A"}</TableCell>
                  <TableCell>{fmea.data?.weibullParams?.scale || "N/A"}</TableCell>
                  <TableCell>{fmea.data?.weibullParams?.mtbf || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Priority Number (RPN) Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Failure Mode</TableHead>
                {fmeas.map((fmea) => (
                  <TableHead key={fmea.id}>{fmea.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Group by failure mode name for comparison */}
              {Array.from(new Set(allFailureModes.map((mode) => mode.name))).map((modeName) => (
                <TableRow key={modeName}>
                  <TableCell>{modeName}</TableCell>
                  {fmeas.map((fmea) => {
                    const mode = fmea.data?.failureModes?.find((m) => m.name === modeName)
                    return (
                      <TableCell key={fmea.id}>
                        {mode ? (
                          <div>
                            <Badge>{mode.rpn || 0}</Badge>
                            <Progress value={((mode.rpn || 0) / maxRPN) * 100} className="h-2 mt-2" />
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Cost Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Failure Mode</TableHead>
                {fmeas.map((fmea) => (
                  <TableHead key={fmea.id}>{fmea.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(new Set(allFailureModes.map((mode) => mode.name))).map((modeName) => (
                <TableRow key={modeName}>
                  <TableCell>{modeName}</TableCell>
                  {fmeas.map((fmea) => {
                    const mode = fmea.data?.failureModes?.find((m) => m.name === modeName)
                    return (
                      <TableCell key={fmea.id}>
                        {mode?.totalCost ? (
                          <div>
                            <Badge variant="outline">${mode.totalCost.toLocaleString()}</Badge>
                            <Progress value={((mode.totalCost || 0) / maxCost) * 100} className="h-2 mt-2" />
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total Annual Cost</TableCell>
                {fmeas.map((fmea) => {
                  const totalCost = fmea.data?.failureModes?.reduce((sum, mode) => sum + (mode.totalCost || 0), 0) || 0
                  return <TableCell key={fmea.id}>${totalCost.toLocaleString()}</TableCell>
                })}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
