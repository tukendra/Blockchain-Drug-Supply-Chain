// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract DrugSupplyChain {

    address public owner;
    string public contractName;
    string public contractVersion;

    constructor() {
        owner = msg.sender;
        contractName = "DrugSupplyChain";
        contractVersion = "1.1";
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    struct Manufacturer {
        uint manufacturerId;
        string location;
        string licenseNo;
        uint supplierId;
        uint govId;
    }

    struct Supplier {
        uint supplierId;
        string name;
        string location;
        string licenseNo;
        uint govId;
    }

    struct Distributor {
        uint distributorId;
        string name;
        string location;
        string licenseNo;
        uint manufacturerId;
    }

    struct Pharmacy {
        uint pharmacyId;
        string name;
        string location;
        string licenseNo;
        uint distributorId;
    }

    struct Customer {
        uint customerId;
        string name;
        string contactInfo;
        uint pharmacyId;
    }

    struct LotBatch {
        uint lotId;
        string drugName;
        uint quantity;
        string mfgDate;
        string expDate;
        uint manufacturerId;
    }

    struct Shipment {
        uint shipmentId;
        uint lotId;
        uint sourceId;
        uint destinationId;
        string shipDate;
        string status;
    }

    struct AuditLog {
        uint auditId;
        string entity;
        string action;
        string timestamp;
        uint userId;
    }

    mapping(uint => Manufacturer) public manufacturers;
    mapping(uint => Supplier) public suppliers;
    mapping(uint => Distributor) public distributors;
    mapping(uint => Pharmacy) public pharmacies;
    mapping(uint => Customer) public customers;
    mapping(uint => LotBatch) public lots;
    mapping(uint => Shipment) public shipments;
    mapping(uint => AuditLog) public auditLogs;

    mapping(uint => bool) public manufacturerExists;
    mapping(uint => bool) public supplierExists;
    mapping(uint => bool) public distributorExists;
    mapping(uint => bool) public pharmacyExists;
    mapping(uint => bool) public customerExists;
    mapping(uint => bool) public lotExists;
    mapping(uint => bool) public shipmentExists;
    mapping(uint => bool) public auditLogExists;

    event ManufacturerAdded(uint indexed manufacturerId, uint indexed supplierId, uint govId);
    event SupplierAdded(uint indexed supplierId, uint govId);
    event DistributorAdded(uint indexed distributorId, uint indexed manufacturerId);
    event PharmacyAdded(uint indexed pharmacyId, uint indexed distributorId);
    event CustomerAdded(uint indexed customerId, uint indexed pharmacyId);
    event LotAdded(uint indexed lotId, uint indexed manufacturerId, uint quantity);
    event ShipmentAdded(uint indexed shipmentId, uint indexed lotId, uint sourceId, uint destinationId);
    event AuditLogAdded(uint indexed auditId, string entity, uint indexed userId);

    function _requirePositive(uint _id) internal pure {
        require(_id > 0, "ID must be greater than zero");
    }

    function _requireNonEmpty(string memory _value, string memory _message) internal pure {
        require(bytes(_value).length > 0, _message);
    }

    function addManufacturer(uint _id, string memory _location, string memory _licenseNo, uint _supplierId, uint _govId) public onlyOwner {
        _requirePositive(_id);
        _requirePositive(_supplierId);
        _requirePositive(_govId);
        _requireNonEmpty(_location, "Location cannot be empty");
        _requireNonEmpty(_licenseNo, "License number cannot be empty");
        require(!manufacturerExists[_id], "Manufacturer ID already exists");
        manufacturers[_id] = Manufacturer(_id, _location, _licenseNo, _supplierId, _govId);
        manufacturerExists[_id] = true;
        emit ManufacturerAdded(_id, _supplierId, _govId);
    }

    function addSupplier(uint _id, string memory _name, string memory _location, string memory _licenseNo, uint _govId) public onlyOwner {
        _requirePositive(_id);
        _requirePositive(_govId);
        _requireNonEmpty(_name, "Name cannot be empty");
        _requireNonEmpty(_location, "Location cannot be empty");
        _requireNonEmpty(_licenseNo, "License number cannot be empty");
        require(!supplierExists[_id], "Supplier ID already exists");
        suppliers[_id] = Supplier(_id, _name, _location, _licenseNo, _govId);
        supplierExists[_id] = true;
        emit SupplierAdded(_id, _govId);
    }

    function addDistributor(uint _id, string memory _name, string memory _location, string memory _licenseNo, uint _manufacturerId) public onlyOwner {
        _requirePositive(_id);
        _requirePositive(_manufacturerId);
        _requireNonEmpty(_name, "Name cannot be empty");
        _requireNonEmpty(_location, "Location cannot be empty");
        _requireNonEmpty(_licenseNo, "License number cannot be empty");
        require(!distributorExists[_id], "Distributor ID already exists");
        distributors[_id] = Distributor(_id, _name, _location, _licenseNo, _manufacturerId);
        distributorExists[_id] = true;
        emit DistributorAdded(_id, _manufacturerId);
    }

    function addPharmacy(uint _id, string memory _name, string memory _location, string memory _licenseNo, uint _distributorId) public onlyOwner {
        _requirePositive(_id);
        _requirePositive(_distributorId);
        _requireNonEmpty(_name, "Name cannot be empty");
        _requireNonEmpty(_location, "Location cannot be empty");
        _requireNonEmpty(_licenseNo, "License number cannot be empty");
        require(!pharmacyExists[_id], "Pharmacy ID already exists");
        pharmacies[_id] = Pharmacy(_id, _name, _location, _licenseNo, _distributorId);
        pharmacyExists[_id] = true;
        emit PharmacyAdded(_id, _distributorId);
    }

    function addCustomer(uint _id, string memory _name, string memory _contactInfo, uint _pharmacyId) public onlyOwner {
        _requirePositive(_id);
        _requirePositive(_pharmacyId);
        _requireNonEmpty(_name, "Name cannot be empty");
        _requireNonEmpty(_contactInfo, "Contact information cannot be empty");
        require(!customerExists[_id], "Customer ID already exists");
        customers[_id] = Customer(_id, _name, _contactInfo, _pharmacyId);
        customerExists[_id] = true;
        emit CustomerAdded(_id, _pharmacyId);
    }

    function addLot(uint _lotId, string memory _drugName, uint _quantity, string memory _mfgDate, string memory _expDate, uint _manufacturerId) public onlyOwner {
        _requirePositive(_lotId);
        _requirePositive(_quantity);
        _requirePositive(_manufacturerId);
        _requireNonEmpty(_drugName, "Drug name cannot be empty");
        _requireNonEmpty(_mfgDate, "Manufacturing date cannot be empty");
        _requireNonEmpty(_expDate, "Expiry date cannot be empty");
        require(!lotExists[_lotId], "Lot ID already exists");
        lots[_lotId] = LotBatch(_lotId, _drugName, _quantity, _mfgDate, _expDate, _manufacturerId);
        lotExists[_lotId] = true;
        emit LotAdded(_lotId, _manufacturerId, _quantity);
    }

    function addShipment(uint _shipmentId, uint _lotId, uint _sourceId, uint _destinationId, string memory _shipDate, string memory _status) public onlyOwner {
        _requirePositive(_shipmentId);
        _requirePositive(_lotId);
        _requirePositive(_sourceId);
        _requirePositive(_destinationId);
        _requireNonEmpty(_shipDate, "Shipment date cannot be empty");
        _requireNonEmpty(_status, "Shipment status cannot be empty");
        require(!shipmentExists[_shipmentId], "Shipment ID already exists");
        shipments[_shipmentId] = Shipment(_shipmentId, _lotId, _sourceId, _destinationId, _shipDate, _status);
        shipmentExists[_shipmentId] = true;
        emit ShipmentAdded(_shipmentId, _lotId, _sourceId, _destinationId);
    }

    function addAuditLog(uint _auditId, string memory _entity, string memory _action, string memory _timestamp, uint _userId) public onlyOwner {
        _requirePositive(_auditId);
        _requirePositive(_userId);
        _requireNonEmpty(_entity, "Entity cannot be empty");
        _requireNonEmpty(_action, "Action cannot be empty");
        _requireNonEmpty(_timestamp, "Timestamp cannot be empty");
        require(!auditLogExists[_auditId], "Audit log ID already exists");
        auditLogs[_auditId] = AuditLog(_auditId, _entity, _action, _timestamp, _userId);
        auditLogExists[_auditId] = true;
        emit AuditLogAdded(_auditId, _entity, _userId);
    }
}
