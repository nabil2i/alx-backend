const express = require('express')
const redis = require('redis')
const { promisify } = require('util')

const app = express()
const client = redis.createClient()

const promisifiedSet = promisify(client.set).bind(client)
const asyncGet = promisify(client.get).bind(client)
const getItemById = (id) => listProducts.filter((product) => product.itemId === id)[0]

const listProducts = [
	{ itemId: 1, itemName: 'Suitcase 250', price: 50, initialAvailableQuantity: 4 },
	{ itemId: 2, itemName: 'Suitcase 450', price: 100, initialAvailableQuantity: 10 },
	{ itemId: 3, itemName: 'Suitcase 650', price: 350, initialAvailableQuantity: 2 },
	{ itemId: 4, itemName: 'Suitcase 1050', price: 50, initialAvailableQuantity: 5 }
]
const port = 1245


app.listen(port, console.log(`Stock app listening at http://localhost:${port}`))
app.get('/list_products', (req, res) => res.json(listProducts))
app.get('/list_products/:itemId', async (req, res) => {
	const itemId = req.params.itemId
	const myItem = getItemById(parseInt(itemId))
	if (!myItem) res.json({ status: 'Product not found' })
	const currentStock = await getCurrentReservedStockById(itemId)
	if (currentStock === null) {
		await reserveStockById(itemId, myItem.initialAvailableQuantity)
		myItem.currentQuantity = myItem.initialAvailableQuantity
	}
	else myItem.currentQuantity = currentStock
	res.json(myItem)
})
app.get('/reserve_product/:itemId', async (req, res) => {
	const itemId = req.params.itemId
	const myItem = getItemById(parseInt(itemId))
	if (!myItem) res.json({ status: 'Product not found' })
	const currentStock = await getCurrentReservedStockById(itemId)
	if (currentStock === null) {
		await reserveStockById(itemId, myItem.initialAvailableQuantity - 1)
		res.json({ status: 'Reservation confirmed', itemId })
	} else if (currentStock > 0) {
		await reserveStockById(itemId, currentStock - 1)
		res.json({ status: 'Reservation confirmed', itemId })
	} else res.json({ status: 'Not enough stock available', itemId })
})

client.on('error', (error) => console.error(`Redis client not connected to the server: ${error.message}`))
client.on('connect', () => console.log('Redis client connected to the server'))

const reserveStockById = (itemId, stock) => promisifiedSet(`item.${itemId}`, stock)
const getCurrentReservedStockById = async (itemId) => await asyncGet(`item.${itemId}`)
