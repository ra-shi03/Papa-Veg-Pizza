import { OTHER_STATION, TRAIN_UNAVAILABLE } from "@food/utils/trainJourney"

/**
 * The fields of a train order: station (from the list), train number, coach, seat and an optional PNR. Both train screens
 * render this, each with its own styling passed in. `info` is the station list from useTrainStations.
 */
export default function TrainJourneyFields({ journey, onChange, info, failed, classes }) {
  const { label = "", input = "", note = "", error = "" } = classes || {}
  const stations = info?.stations || []
  const unavailable = failed || (info && !info.available)
  const set = (change) => onChange({ ...journey, ...change })
  // "Another station" (typed by name) exists only while a default train store can serve it
  const selected = journey.other ? OTHER_STATION : journey.stationCode

  if (unavailable) return <p className={error} role="alert">{TRAIN_UNAVAILABLE}</p>

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className={label}>Your station</label>
        <select
          value={selected}
          disabled={!info}
          onChange={(e) => {
            const value = e.target.value
            if (value === OTHER_STATION) return set({ stationCode: "", stationName: "", other: true })
            const station = stations.find((s) => s.code === value)
            set({ stationCode: value, stationName: station?.name || "", other: false })
          }}
          className={input}
        >
          <option value="">{info ? "Choose your station" : "Loading stations..."}</option>
          {stations.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
          {info?.defaultAvailable && <option value={OTHER_STATION}>Another station</option>}
        </select>
        {selected === OTHER_STATION && (
          <input type="text" maxLength={80} placeholder="Station name" value={journey.stationName} onChange={(e) => set({ stationName: e.target.value.replace(/[<>]/g, "") })} className={input} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className={label}>Train no.</label>
          <input type="text" inputMode="text" maxLength={10} placeholder="12301" value={journey.trainNo} onChange={(e) => set({ trainNo: e.target.value.replace(/[^A-Za-z0-9-]/g, "") })} className={input} />
        </div>
        <div className="space-y-1">
          <label className={label}>Coach</label>
          <input type="text" maxLength={6} placeholder="B2" value={journey.coach} onChange={(e) => set({ coach: e.target.value.replace(/[^A-Za-z0-9-]/g, "") })} className={input} />
        </div>
        <div className="space-y-1">
          <label className={label}>Seat</label>
          <input type="text" maxLength={8} placeholder="14" value={journey.seat} onChange={(e) => set({ seat: e.target.value.replace(/[^A-Za-z0-9/-]/g, "") })} className={input} />
        </div>
      </div>

      <div className="space-y-1">
        <label className={label}>PNR (optional)</label>
        <input type="text" inputMode="numeric" maxLength={10} placeholder="10 digit PNR" value={journey.pnr} onChange={(e) => set({ pnr: e.target.value.replace(/\D/g, "").slice(0, 10) })} className={input} />
        <p className={note}>Only passed on to the delivery partner as a note.</p>
      </div>
    </div>
  )
}

