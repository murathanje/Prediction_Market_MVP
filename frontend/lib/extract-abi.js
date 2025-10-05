const fs = require('fs');
const path = require('path');

const contracts = ['SettlementToken', 'MarketFactory', 'PredictionMarket'];

contracts.forEach(contract => {
  const jsonPath = path.join(__dirname, `../../contracts/out/${contract}.sol/${contract}.json`);
  const outputPath = path.join(__dirname, `abi/${contract}.json`);
  
  const contractJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  fs.writeFileSync(outputPath, JSON.stringify(contractJson.abi, null, 2));
  
  console.log(`Extracted ABI for ${contract}`);
});

console.log('ABI extraction complete!');
