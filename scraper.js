const puppeteer = require("puppeteer")
const {v4 : uuidv4} = require("uuid"); 


function getDateTimeOfPublish(datetimeString) {
    let parts = datetimeString.split(" ");
    let unit = parts[1];
    //console.log(unit);
    let nums = parseInt(parts[0]);
    
    let presentDateTime = new Date();
    //console.log('Current Date and Time:', presentDateTime);

    switch(unit) {
        case 'days':
        case 'day':
            const daysToSubtract = nums;
            //console.log("It is day");
            presentDateTime.setDate(presentDateTime.getDate() - daysToSubtract);
            break;
        case 'hours':
        case 'hour':
            const hoursToSubtract = nums;
            //console.log("It is hours");
            presentDateTime.setHours(presentDateTime.getHours() - hoursToSubtract);
            break;
        case 'months':
        case 'month' :
            const monthsToSubtract = nums;
            //console.log("it is month")
            presentDateTime.setMonth(presentDateTime.getMonth()-monthsToSubtract);
        default:
            console.log("Modified");
    }
    //console.log('Date and Time after modification:', presentDateTime);
    const day = presentDateTime.getDate();
    const month = presentDateTime.getMonth();
    const year  = presentDateTime.getFullYear();
    const hours = presentDateTime.getHours();
    const minutes = presentDateTime.getMinutes();
    const seconds = presentDateTime.getMinutes()
    const formattedDateTime = `${day}-${month}-${year}, ${hours}:${minutes}:${seconds}`;
    // console.log(formattedDateTime)

    return formattedDateTime;
}


const startScraping = async (searchValue)=> {
    const browser = await puppeteer.launch();
    // console.log(browser)
    console.log("browser launched")
    const page = await browser.newPage();
    await page.goto(`https://medium.com/search?q=${searchValue}`);
    let scrapedDataList = []

    try {
        const allArticleElements = await page.$$('article');
        for(let eachArticle of allArticleElements) {
            let eachArticleInfoObj = {}
            // const headingElement = await eachArticle.$('h2');
            const authorName = await eachArticle.$('p')
            const authorNameText = await page.evaluate(el => el.textContent , authorName)
            // extracted author name
            const highlightText = await eachArticle.$('h2')
            const highlightTextContent = await page.evaluate(el=>el.textContent , highlightText)
            // extracted Heading
            
            const  profileImgElement= await eachArticle.$("img");
            const imageUrl = await profileImgElement.evaluateHandle(img => img.getAttribute('src'));
            const extractedProfileImgUrl = await imageUrl.jsonValue();
            // extracted Profile image url
            //console.log("after image url");
            const mainCont = await eachArticle.$("div > div > div > div > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > a > span > div");
            // console.log("after mainCont")
            const mainContSelector = "div > div > div > div > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > a > span > div";
            // console.log("after mainContSelector")
            // const mainContSelector = ".ms.mt.mu.mv.mw.ab.q";
            await page.waitForSelector(mainContSelector , setTimeout(()=>{console.log("searched")} , 5000));
            // console.log("after waitin for element to be loaded");

            const delayText = await mainCont.getProperty('innerText')
            const text = await delayText.jsonValue();
            // console.log(text)
            const parts = text.split('\n').map(part => part.trim());
            // console.log(parts)
            const filteredList = parts.filter((eachText)=>(!eachText.includes(".")))
            // console.log(filteredList)
            const postedAgo = filteredList[filteredList.length - 1];
            // console.log(postedAgo)
            const calculatedPostedDate = getDateTimeOfPublish(postedAgo)

            // const dayAgoPart = parts.find(part => part.includes('day ago'));

            // getting links
            const divElement = await eachArticle.$('div[data-href]');
            const dataHrefValue = await divElement.evaluateHandle(div => div.getAttribute('data-href'));
            const linkValue = await dataHrefValue.jsonValue();

            // console.log(jsonValue);
            eachArticleInfoObj = {"id" : uuidv4() ,"authorName" : authorNameText , "title" : highlightTextContent , "publicationDate" : calculatedPostedDate , "navigationLink" : linkValue , "profileImgUrl" : extractedProfileImgUrl};
            console.log(eachArticleInfoObj)
            scrapedDataList.push(eachArticleInfoObj)

        }
        // console.log("getting authors");
    }
    catch(e) {
        console.log(e.message)
        return {ok : false , scrapedDataList}
    }



    await browser.close();
    if(scrapedDataList.length === 0) {
        return {ok : false , scrapedDataList}
    }
    return {ok : true , scrapedDataList}
}

// obtainedScrapedDataList = startScraping("machine learning")
// console.log(obtainedScrapedDataList)


// getDateTimeOfPublish("1 day ago");
// getDateTimeOfPublish("3 hours ago");
// getDateTimeOfPublish("3 months ago");


module.exports = {startScraping}