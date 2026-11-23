# selfie_nyc

![banner](https://github.com/juliacodessometimes/selfie_nyc/blob/main/docs/assets/logo.png)

This is an app that lets you take selfies using NYC's live traffic cameras.

Check out the fully delployed site at [selfienyc.net](https://selfienyc.net/)! All of the code for the finished site (including a Flask backend and a Python file that scrapes NYDOT's website) can be found in the [app](https://github.com/juliacodessometimes/selfie_nyc/tree/main/app) folder.

The [GitHub page](https://juliacodessometimes.github.io/selfie_nyc/) is just used for front-end and design testing only and doesn't have any of the features served by a backend (for example, the ability to save/download selfies). All the code for this version can be found in the [docs](https://github.com/juliacodessometimes/selfie_nyc/tree/main/docs) folder.

The original code [docs](https://github.com/juliacodessometimes/selfie_nyc/blob/main/selfie_nyc.ipynb) used to scrape the camera locations 5 years ago might not work anymore. This new python script [docs](https://github.com/juliacodessometimes/selfie_nyc/blob/main/update_cameras.py) downloads the geojson file directly from NYCDOT's API and contains the same data.
