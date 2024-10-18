## Running The Frontend
### Install Node.js
To run the frontend Node.js & npm are needed. You can check Node.js installation status via the terminal commands `node -v` and then `npm -v`. If Node.js is not installed on your machine (the likely case), you can download it via a few different ways.
* Use a prebuilt installer: https://nodejs.org/en/download/prebuilt-installer
* Use a package manager via command line: https://nodejs.org/en/download/package-manager/
* You can install via *nvm*: https://github.com/nvm-sh/nvm

Using a prebuilt installer is recommended for simplicity.

### Frontend Set-up and Running The Website
The following terminal commands will walk you through installing and running the frontend.
1. Navigate to this directory if you haven't already. (`cd databrick-frontend`)
2. Install the required libraries via the *package.json* list present: \
   `npm install`
3. Run the website!: \
   `npm start`

By default you can access the website via `http://localhost:3000/`. Note that the backend must be running and database migrated to achieve full software functionality.

### Testing
A test runner can be launched in an interactive watch mode via - `npm test`
Further information on this testing process can be found [here](https://facebook.github.io/create-react-app/docs/running-tests).

### Settings
The url to the backend can be changed in *.env* by adjusting the `REACT_APP_API_URL` value. Additionally, the number of files uploaded at a time to the backend can be changed via `REACT_APP_MAX_CONCURRENT_UPLOADS`.

## Additional information provided by Create React App
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). \
In the project directory, you can also run:

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
