const express = require('express');
const redis = require('redis');
const { promisify } = require('util');
import kue from 'kue';

const app = express();
const client = redis.createClient();

const promisifiedSet = promisify(client.set).bind(client);
const asyncGet = promisify(client.get).bind(client);

const jobData = { available_seats: 50 };

let reservationEnabled = true;
const queue = kue.createQueue();

const reserveSeat = (number) => promisifiedSet(`available_seats`, number);
const getCurrentAvailableSeats = async () => await asyncGet(`available_seats`);

reserveSeat(jobData.available_seats);

const port = 1245;
app.listen(port, console.log(`Stock app listening at http://localhost:${port}`));


app.get('/available_seats', async (req, res) => {
  const currentSeats = await getCurrentAvailableSeats();
  res.json({ "numberOfAvailableSeats": `${currentSeats}` });
});
app.get('/reserve_seat', async (req, res) => {
  if (!reservationEnabled) {
    res.json({ "status": "Reservation are blocked" })
  } else {
    const job = queue.create('reserve_seat', jobData)
    .save((error) => {
      if (error)
      {
        res.json({ "status": "Reservation failed" })
      } else {
        res.json({ "status": "Reservation in process" })
      }
    })
    .on('complete', () => console.log(`Seat reservation job ${job.id} completed`))
    .on('failed', (error) => console.log(`Seat reservation job #${job.id} failed: ${error}`));
  }
})

app.get('/process', (req, res) => {
  res.json({ "status": "Queue processing" })
  queue.process('reserve_seat', (job, done) => {
    reserveSeatJob(job, done)
    done();
  });
})

client.on('error', (error) => console.error(`Redis client not connected to the server: ${error.message}`))
client.on('connect', () => console.log('Redis client connected to the server'))


const reserveSeatJob = async (job, done) => {
  const currentSeats = await getCurrentAvailableSeats();
    if (currentSeats > 0) {
      const updateSeats = currentSeats - 1
      await reserveSeat(updateSeats);
      if (updateSeats == 0) {
        reservationEnabled = false
      }
    } else return done(new Error('Not enough seats available'))
}
