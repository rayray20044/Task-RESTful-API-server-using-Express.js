import app from './app.js'

const port = process.env.EXERCISE_PORT || 3000;
const host = process.env.EXERCISE_HOST || 'localhost';

app.listen(port, host,()=>{
    console.log(`Works! Here is the link: http://${host}:${port}`)
})

