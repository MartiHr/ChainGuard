// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChainGuard {
    struct Evidence {
        string cid;          // IPFS hash
        uint256 timestamp;   
        address owner;       
        bool isPublic;       
        string latitude;     
        string longitude;    
    }

    mapping(string => Evidence) public evidences;
    string[] public publicCIDs;
    mapping(address => string[]) public userEvidences;

    event EvidenceStored(string cid, address indexed owner, bool isPublic, string latitude, string longitude);

    function storeEvidence(
        string memory _cid, 
        bool _isPublic, 
        address user, 
        string memory _latitude, 
        string memory _longitude
    ) public {
        require(bytes(_cid).length > 0, "CID is required");
        require(evidences[_cid].timestamp == 0, "Evidence already exists");

        evidences[_cid] = Evidence({
            cid: _cid,
            timestamp: block.timestamp,
            owner: user,
            isPublic: _isPublic,
            latitude: _latitude,
            longitude: _longitude
        });

        userEvidences[user].push(_cid);

        if (_isPublic) {
            publicCIDs.push(_cid);
        }

        emit EvidenceStored(_cid, user, _isPublic, _latitude, _longitude);
    }

    function getPublicFeed() public view returns (Evidence[] memory) {
        Evidence[] memory result = new Evidence[](publicCIDs.length);
        for (uint i = 0; i < publicCIDs.length; i++) {
            result[i] = evidences[publicCIDs[i]];
        }
        return result;
    }

    function getEvidencesByUser(address user) public view returns (Evidence[] memory) {
        string[] memory cids = userEvidences[user];
        Evidence[] memory result = new Evidence[](cids.length);
        for (uint i = 0; i < cids.length; i++) {
            result[i] = evidences[cids[i]];
        }
        return result;
    }
}