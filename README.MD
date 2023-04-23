## Tech stack:

- Node.js
- Redis

## Feature:

- Multi-thread Node.js server
- Multi-thread Redis pool connect
- Minimum package use

## API entrance:

- Read data by meter number: (method GET)

  `host:port/energysavvy/api/readbymeter/:meter_number`

  Example: `http://150.230.113.32:8899/energysavvy/api/readbymeter/meter_number_7725479`

- Read data by rowID: (method GET)

  `host:port/energysavvy/api/readbyrowid/:rowID`

- Create link between use input email and meter_number: (method POST)

  `host:port/energysavvy/api/meterregister/:meter_number`

  Example: `POST http://150.230.113.32:8899/energysavvy/api/addemailtometer/meter_number_7725479` with body: `{"email": "testing@mail.com"} return {"result":"success"}`

- Check meter link with email: (method GET)

  `http://150.230.113.32:8899/energysavvy/api/checkmeter/meter_number_7725479`

## Description:

- Multi-thread web server comes with multi-thread memory DB provide top-notch performance.
- Minimum package can be less dependencies.
- The router.js is a customize build framework mimicking Express, I build it months ago, just copy it into this project, can be replace by Express.

## Live instance:

http://150.230.113.32:8899/energysavvy/api/readbymeter/meter_number_7725479
