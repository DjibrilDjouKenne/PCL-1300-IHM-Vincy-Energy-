#!/usr/bin/env python3
import sys, json, numpy as np
from datetime import datetime, timedelta

try:
    import netCDF4 as nc
except ImportError:
    print(json.dumps({"error": "netCDF4 non installé"})); sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Chemin manquant"})); sys.exit(1)

    filepath = sys.argv[1]
    try:
        ds = nc.Dataset(filepath, 'r')
    except Exception as e:
        print(json.dumps({"error": str(e)})); sys.exit(1)

    try:
        # ── Altitudes ──
        altitudes = ds.variables['altitude'][:].tolist() if 'altitude' in ds.variables else []

        # ── Temps ──
        times = []
        if 'time' in ds.variables:
            tv = ds.variables['time']
            raw = tv[:].tolist()
            units = getattr(tv, 'units', None)
            cal   = getattr(tv, 'calendar', 'standard')
            print(f"DEBUG units='{units}' raw[0]={raw[0]}", file=sys.stderr)
            if units:
                tdt = nc.num2date(tv[:], units=units, calendar=cal)
                times = ["{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}Z".format(
                    int(t.year),int(t.month),int(t.day),int(t.hour),int(t.minute),int(t.second))
                    for t in tdt]
            else:
                T0 = datetime(2026, 1, 1, 0, 0, 0)
                DT = 15
                max_r = max(raw) if raw else 0
                times = [(T0 + timedelta(seconds=int(r) if max_r>10000 else 0,
                                         minutes=int(r)*DT if max_r<=10000 else 0)
                         ).strftime("%Y-%m-%dT%H:%M:%SZ") for r in raw]

        # ── Toutes les variables ──
        def extract(varname):
            if varname not in ds.variables: return None
            v = ds.variables[varname][:]
            if hasattr(v, 'filled'): v = v.filled(np.nan)
            arr = v.tolist()
            if isinstance(arr[0], list):
                return [[None if (isinstance(x,float) and np.isnan(x)) else x for x in row] for row in arr]
            return [None if (isinstance(x,float) and np.isnan(x)) else x for x in arr]

        # Variables connues
        result = {
            "meta":      {a: str(getattr(ds,a)) for a in ds.ncattrs()},
            # "dims":      {k: v for k,v in ds.dimensions.items() if hasattr(v,'size') and v.size is not None},
            "dims":      {k: len(v) for k,v in ds.dimensions.items()},
            "vars":      list(ds.variables.keys()),
            "altitudes": altitudes,
            "times":     times,
        }

        # Toutes les autres variables dynamiquement
        skip = {'altitude','time'}
        for varname in ds.variables:
            if varname not in skip:
                result[varname] = extract(varname)

        ds.close()
        print(json.dumps(result, allow_nan=False))

    except Exception as e:
        try: ds.close()
        except: pass
        print(json.dumps({"error": str(e)})); sys.exit(1)

if __name__ == '__main__':
    main()
