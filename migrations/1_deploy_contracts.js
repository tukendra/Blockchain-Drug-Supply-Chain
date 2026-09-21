const DrugSupplyChain = artifacts.require("DrugSupplyChain");

module.exports = function (deployer) {
  deployer.deploy(DrugSupplyChain);
};
