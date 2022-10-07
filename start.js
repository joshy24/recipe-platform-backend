require ("dotenv").config()

const log = require('./modules/logger.module')

const app = require('./server.js')
//Setup port from environment or default
const port = process.env.PORT || 4000

app.listen(port, () => {
    log.info(`Server is running on port ${port}`)
})
