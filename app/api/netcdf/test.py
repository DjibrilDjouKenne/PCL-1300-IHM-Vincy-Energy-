# # from netCDF4 import Dataset
# # import numpy as np

# # # Création du fichier
# # ds = Dataset("mon_fichier.nc", "w", format="NETCDF4")


# # time_dim = ds.createDimension("time", 100)   
# # lat_dim  = ds.createDimension("lat", 180)   
# # lon_dim  = ds.createDimension("lon", 360)    

# # times = ds.createVariable("time", "f4", ("time",))
# # lats  = ds.createVariable("lat", "f4", ("lat",))
# # lons  = ds.createVariable("lon", "f4", ("lon",))


# # times.units = "hours since 2026-08-01 00:00:00"
# # times.long_name = "time"

# # lats.units = "degrees_north"
# # lats.long_name = "latitude"

# # lons.units = "degrees_east"
# # lons.long_name = "longitude"


# # times[:] = np.arange(100)
# # lats[:]  = np.linspace(-90, 90, 180)
# # lons[:]  = np.linspace(-180, 180, 360)


# # temp = ds.createVariable("temperature", "f4", ("time", "lat", "lon"),
# #                          fill_value=-9999)

# # temp.units = "K"
# # temp.long_name = "air_temperature"


# # temperature_data = 280 + 10 * np.random.randn(100, 180, 360)

# # temp[:] = temperature_data


# # ds.close()

# # print("Fichier NetCDF créé avec succès !")











# from netCDF4 import Dataset

# ds = Dataset("C:/Users/Admin/Desktop/spectreDoppler.nc", "r")
# print(ds)
# # time = ds.variables["time"][:]   # lit tout
# # altitudes = ds.variables["u"][:]
# # print(time)
# # print(altitudes)
# # print(ds.dimensions)

# for dim in ds.dimensions.values():
#     print(dim.name, dim.size)

# # temp = ds.variables["temperature"][:]   # les deux points = tout lire
# # print(temp)

# ds.close()

from netCDF4 import Dataset

src = r"C:/Users/Admin/Desktop/spectreDoppler.nc"
dst = r"C:/Users/Admin/Desktop/spectreDopplerRenamed.nc"

# Ouvrir l'ancien fichier
ds_in = Dataset(src, "r")

# Créer le nouveau fichier
ds_out = Dataset(dst, "w")

# --- 1) Copier les dimensions avec renommage ---
for dim_name, dim in ds_in.dimensions.items():
    if dim_name == "height":
        new_dim_name = "altitude"
    else:
        new_dim_name = dim_name

    ds_out.createDimension(new_dim_name, len(dim))

# --- 2) Copier les variables avec renommage ---
for var_name, var in ds_in.variables.items():

    # Nouveau nom de variable
    if var_name == "height":
        new_var_name = "altitude"
    elif var_name == "spectrum":
        new_var_name = "spectra"
    else:
        new_var_name = var_name

    # Nouvelles dimensions
    new_dims = []
    for d in var.dimensions:
        if d == "height":
            new_dims.append("altitude")
        else:
            new_dims.append(d)

    # Créer la variable (sans collision)
    if new_var_name not in ds_out.variables:
        new_var = ds_out.createVariable(new_var_name, var.dtype, new_dims)
    else:
        new_var = ds_out.variables[new_var_name]

    # Copier les données
    new_var[:] = var[:]

    # Copier les attributs
    for attr in var.ncattrs():
        setattr(new_var, attr, getattr(var, attr))

# Copier les attributs globaux
for attr in ds_in.ncattrs():
    setattr(ds_out, attr, getattr(ds_in, attr))

ds_in.close()
ds_out.close()

print("Renommage terminé ! Nouveau fichier créé :", dst)
