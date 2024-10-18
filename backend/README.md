## Running The Backend
### Install Python
To run the backend python is needed. You can check if you have python installed via the command `py --version` in your terminal. You may need to replace `py` with `python` or `python3` if on a system other than Windows. This follows for all references to `py` from this point onwards.
If python is not installed, you can download an installer from [here](https://www.python.org/downloads/).

### Install FFmpeg
Additionally, FFmpeg is needed for video file editing operations. You can check if FFmpeg is installed by just entering `FFmpeg` or `FFmpeg -version` in your terminal. In the likely case that it isn't installed, installation instructions can be sourced from [here](https://www.ffmpeg.org/download.html). As an example, you can install a build for it on Windows OS via *winget* (`winget install "FFmpeg (Essentials Build)"` in terminal).

### (Optional) Set up a Virtual Environment
It is recommended to perform this installation and run the backend inside of a virtual environment. This keeps libraries local rather than potentially system wide. If you choose to do so, you will need to start the virtual environment each time you wish to run this code. A guide to do so for Unix/macOS and Windows can be found [here](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/), but to be verbose, you may also follow the below steps for a Windows system:
1. Open the terminal in / navigate to this repository, 'DB-Quoll' or 'DB-Quoll/backend
2. Set up environment via the following command - `py -m venv .venv`
3. Run the environment via the following command - `.venv\Scripts\activate`

From this point onwards you can enter the environment via `.venv\Scripts\activate`, and exit via `deactivate` when in this directory.

### Backend Set-up and Running The Server
The following terminal commands will walk you through installing, setting up, and running the backend.
1. Navigate to this directory if you haven't already. (`cd backend`)
2. Ensure that pip is installed and up to date: \
   `py -m pip install --upgrade pip`
3. Install the required libraries: \
   `pip install -r requirements.txt`
4. Migrate / create the database file:
   1. Generate any missing model migrations: \
      `py manage.py makemigrations`
   2. Create the database: \
      `py manage.py migrate`
5. Create an admin user (follow the instructions that appear): \
   `py manage.py createsuperuser` 
6. Run the server!: \
   `py manage.py runserver`

From this point onwards, you can create more admins as required, and run the server whenever needed via step 6.

### Testing
Written django tests can be ran via - `py manage.py test`

### Settings
All main adjustable settings regarding running the server can be found in the file *backend/.env*. 
* It is recommended that you change the email host address (`EMAIL_HOST_USER`, and `EMAIL_HOST_PASSWORD` in turn), `DEFAULT_FROM_EMAIL`, and default administrator (`ADMIN_NAME`, `ADMIN_EMAIL`) to your own details.
* Debug messages can be toggled via the line `DEBUG=True` or `DEBUG=False`. In production this should be set to false.
* Frontend and backend urls can also be changed here. Further server adjustments can be made as needed in the file *backend/core/settings.py*.

Additionally, file upload and output constraints can be adjusted in *backend/videos/constants.py*. For example, if you want to allow but trim videos that are longer than a given frame count, you can increase the `TRIM_MARGIN` value in this file. Currently set to 2 seconds by default (60 frames @ 30 FPS).

By default, the Rest Framework API can be accessed via `http://localhost:8000/api/`. Alternatively, the Django administrative portal can be accessed via `http://localhost:8000/admin/`.