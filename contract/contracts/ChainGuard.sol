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

    // New: Track evidences per user
    mapping(address => string[]) public userEvidences;

    event EvidenceStored(string cid, address indexed owner, bool isPublic);

    function storeEvidence(string memory _cid, bool _isPublic, address user) public {
        require(bytes(_cid).length > 0, "CID is required");
        require(evidences[_cid].timestamp == 0, "Evidence already exists");

        evidences[_cid] = Evidence({
            cid: _cid,
            timestamp: block.timestamp,
            owner: user,
            isPublic: _isPublic
        });

        // New: Track for user
        userEvidences[user].push(_cid);

        if (_isPublic) {
            publicCIDs.push(_cid);
        }

        emit EvidenceStored(_cid, user, _isPublic);
    }

    // Функция за взимане на целия публичен фийд
    function getPublicFeed() public view returns (Evidence[] memory) {
        Evidence[] memory result = new Evidence[](publicCIDs.length);
        for (uint i = 0; i < publicCIDs.length; i++) {
            result[i] = evidences[publicCIDs[i]];
        }
        return result;
    }

    // New: Get evidences by user
    function getEvidencesByUser(address user) public view returns (Evidence[] memory) {
        string[] memory cids = userEvidences[user];
        Evidence[] memory result = new Evidence[](cids.length);
        for (uint i = 0; i < cids.length; i++) {
            result[i] = evidences[cids[i]];
        }
        return result;
    }
}