import redis from 'redis';
const client = redis.createClient();

client.on("error", (error) => {
    if (error) console.log(`Redis client not connected to the server: ${error}`)
  }).on('ready', () => {
      console.log('Redis client connected to the server');
  });

const name = 'HolbertonSchools';
const mydata = {'Portland': 50,
               'Seattle': 80,
               'New York': 20,
               'Bogota': 20,
               'Cali': 40,
               'Paris': 2}

for (const [key, val] of Object.entries(mydata)) {
  client.hset(name, key, val, (error, reply) => {
    if (error) {
      console.log(error);
    } else {
      redis.print((`Reply: ${reply}`));
    }
  });
}

client.hgetall(name, (error, object) => {
  if (error) {
    console.log(error);
  } else {
    console.log(object);
  }
});
