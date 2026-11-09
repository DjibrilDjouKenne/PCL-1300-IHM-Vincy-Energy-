import sys
import json
import netCDF4 as nc

def main():
    payload = json.loads(sys.argv[1])
    ds = nc.Dataset(payload['path'], 'w', format='NETCDF4')
    ds.createDimension('x', len(payload['data']))
    var = ds.createVariable(payload['varName'], 'f8', ('x',))
    var[:] = payload['data']
    ds.close()
    print(json.dumps({"status": "ok", "path": payload['path']}))

if __name__ == '__main__':
    main()