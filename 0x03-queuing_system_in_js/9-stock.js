const express = require('express');
const redis = require("redis");
const util = require('util')

const client = redis.createClient();
const get = util.promisify(client.get).bind(client);

const app = express()
const port = 1245

const listProducts = [{
  'itemId': 1,
  'itemName': 'Suitcase 250',
  'price': '50',
  'initialAvailableQuantity': '4'

}, {
  'itemId': 2,
  'itemName': 'Suitcase 450',
  'price': '100',
  'initialAvailableQuantity': '10'
}, {
  'itemId': 3,
  'itemName': 'Suitcase 650',
  'price': '350',
  'initialAvailableQuantity': '2'
}, {
  'itemId': 4,
  'itemName': 'Suitcase 1050',
  'price': '550',
  'initialAvailableQuantity': '5'
}]


function getItemById(id) {
  return listProducts.filter((person) => person.itemId === id)
}


async function reserveStockById(itemId, stock) {
  let value = await get(itemId)
  if (value == undefined) {
    value = 0;
  }
  client.set(itemId, stock + Number(value));
}


async function getCurrentReservedStockById(itemId) {
  const red = await get(itemId)
  return red
}


app.get('/list_products', (req, res) => {
  res.send(JSON.stringify(listProducts))
})

app.get('/list_products/:itemId', function(req, res
  const id = Number(req.params.itemId)
  const value = getItemById(id)[0]

  if (!value) {
    res.send(JSON.stringify({ "status": "Product not found" }))
  }
  res.send(JSON.stringify(value))
})

app.get('/reserve_product/:itemId', async function(req, res) {
  const id = Number(req.params.itemId)
  const value = getItemById(id)[0]

  if (!value) {
    res.send(JSON.stringify({ "status": "Product not found" }))
  }

  const initial = value.initialAvailableQuantity
  const current = await getCurrentReservedStockById(id)

  if (Number(initial) <= Number(current)) {
    res.send({ "status": "Not enough stock available", "itemId": id })
  }

  reserveStockById(id, 1);

  res.send(JSON.stringify({ "status": "Reservation confirmed", "itemId": id }))
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
