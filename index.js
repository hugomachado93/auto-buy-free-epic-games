/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

const puppeteer = require('puppeteer')

exports.autoBuyEpicGames = async (req, res) => {
  await autoBuy()
  let message = req.query.message || req.body.message || 'Hello World!';
  res.status(200).send(message);
};

const getUsers = () => {
    const users = process.env.USERS.split(',')
    const passwords = process.env.PASSWORDS.split(',')

    return [users, passwords]
}

const autoBuy = async() => {

    const creds = getUsers()

    const users = creds[0]
    const passwords = creds[1]

    for (i in users){

        console.log("Initializing")
        const site = "https://www.epicgames.com/id/login?lang=en_US&redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fstore%2Fen-US%2F&client_id=875a3b57d3a640a6b7f9b4e883463ab4&noHostRedirect=true"
        const browser = await puppeteer.launch({args: ['--no-sandbox']})
        const page = await browser.newPage()

        console.log(users[i])

        console.log("Starting")
        await page.goto(site, {waitUntil: 'networkidle2'})
        await page.type('#email', users[i])
        await page.type('#password', passwords[i])
        console.log(`Logging in account ${users[i]}`)
        await Promise.all([page.click('#login'), page.waitForNavigation({waitUntil: 'networkidle2'})])

        console.log("Logged in")

        const results = await page.evaluate(() => {
            var temp = []
            e = document.querySelectorAll('a[aria-label]')
            e.forEach(function(val, i){
                const ariaLabel = val.getAttribute('aria-label')
                if(ariaLabel.includes("Free Game")){
                    temp.push("https://www.epicgames.com" + val.getAttribute('href'))
                }
            })
            return temp
        })


        for(const result of results){

            console.log(`Going to purshase page -> ${result}`)

            await page.goto(result, {waitUntil: 'networkidle2'})

            const spanHandler = await page.$x("//span[contains(text(), 'Continue')]")

            if(spanHandler.length > 0){

                await Promise.all([spanHandler[0].click(), page.waitFor(1000)])

                console.log(`Game is mature, continuing`)

            }else {
                console.log(`Game is not mature`)
            }

            const getHandler = await page.$x("//button/span/span[contains(text(), 'Get')]")

            if(getHandler.length > 0){

                console.log("Buying game")

                await Promise.all([getHandler[0].click(), page.waitFor(5000)])

                const placeOrderHandler = await page.$x("//button/span[contains(text(), 'Place Order')]")
                
                console.log("Placing order")

                await Promise.all([placeOrderHandler[0].click(), page.waitFor(5000)])

            }else {
                console.log("Game already owned or not available")
            }

        }
        await browser.close()
    }
}
