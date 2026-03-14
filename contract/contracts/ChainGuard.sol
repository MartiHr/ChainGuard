// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChainGuard {
    struct Evidence {
        string cid;          // IPFS хеш (адресът на видеото)
        uint256 timestamp;   // Точно време на записа
        address owner;       // Кой е изпратил доказателството
        bool isPublic;       // Дали да се вижда в публичния фийд
    }

    // Търсене на доказателство по неговия CID
    mapping(string => Evidence) public evidences;
    
    // Списък с всички публични доказателства за News Feed-а
    string[] public publicCIDs;

    event EvidenceStored(string cid, address indexed owner, bool isPublic);

    function storeEvidence(string memory _cid, bool _isPublic) public {
        require(bytes(_cid).length > 0, "CID is required");
        require(evidences[_cid].timestamp == 0, "Evidence already exists");

        evidences[_cid] = Evidence({
            cid: _cid,
            timestamp: block.timestamp,
            owner: msg.sender,
            isPublic: _isPublic
        });

        if (_isPublic) {
            publicCIDs.push(_cid);
        }

        emit EvidenceStored(_cid, msg.sender, _isPublic);
    }

    // Функция за взимане на целия публичен фийд
    function getPublicFeed() public view returns (string[] memory) {
        return publicCIDs;
    }
}