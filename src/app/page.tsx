"use client";

import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { defineChain, getContract, prepareContractCall } from "thirdweb";
import { NFTProvider, NFTMedia, NFTName } from "thirdweb/react";
import { client } from "./client";
import React from "react";

export default function Home() {
  const address = useActiveAccount()?.address;
  

  return (
    <main className="p-6 min-h-screen flex items-center justify-center container max-w-screen-lg mx-auto bg-black text-white">
      <div className="py-20 w-full flex flex-col items-center">
        <ConnectButton
          client={client}
        />
        {address && <NFTGrid address={address} />}
      </div>
    </main>
  );
}

function NFTGrid({ address }: { address: string }) {
  const [nftsErc721, setNftsErc721] = React.useState<any[]>([]);
  const [nftsErc1155, setNftsErc1155] = React.useState<any[]>([]);

  React.useEffect(() => {
    const getNFTsErc721 = async () => {
      try {
        const response = await fetch(
          // supported chains: https://thirdweb.com/chainlist?service=insight, add a new one using `&chain=chainid` in the request
          `https://insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}/tokens/erc721/${address}?metadata=false&chain=1&chain=10&chain=137&chain=1868&chain=8453`
        );
        const data = await response.json();
        setNftsErc721(data.data);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      }
    };
    const getNFTsErc1155 = async () => {
      try {
        const response = await fetch(
          // supported chains: https://thirdweb.com/chainlist?service=insight, add a new one using `&chain=chainid` in the request
          `https://insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}/tokens/erc1155/${address}?metadata=false&chain=1&chain=10&chain=137&chain=1868&chain=8453`
        );
        const data = await response.json();
        setNftsErc1155(data.data);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      }
    };
    getNFTsErc721();
    getNFTsErc1155();
  }, [address]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
      <h2 className="col-span-full text-xl font-bold text-center border-b border-gray-600 pb-2">
        ERC-721 NFTs
      </h2>
      {nftsErc721.map((nft) => (
        <NFT key={nft.tokenId} tokenAddress={nft.tokenAddress} tokenId={BigInt(nft.tokenId)} chainId={nft.chainId} balance={1} owner={address} type="erc721" />
      ))}
      <h2 className="col-span-full text-xl font-bold text-center border-b border-gray-600 pb-2">
        ERC-1155 NFTs
      </h2>
      {nftsErc1155.map((nft) => (
        <NFT key={nft.tokenId} tokenAddress={nft.tokenAddress} tokenId={BigInt(nft.tokenId)} chainId={nft.chainId} balance={nft.balance} owner={address} type="erc1155" />
      ))}
    </div>
  );
}

function NFT({ tokenAddress, tokenId, chainId, owner, type, balance }: { tokenAddress: string; tokenId: bigint; chainId: number; owner: string; type: string, balance: number }) {
  const [showPopup, setShowPopup] = React.useState(false);
  const [transferAddress, setTransferAddress] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);

  const contract = getContract({ address: tokenAddress, chain: defineChain(chainId), client: client });

  return (
    <div className="bg-black border border-gray-700 shadow-lg rounded-lg p-4 text-white flex flex-col items-center">
      <NFTProvider contract={contract} tokenId={tokenId}>
        <NFTMedia className="w-full h-48 object-cover rounded-md mb-4" />
        <NFTName className="text-lg font-semibold mb-2" />
      </NFTProvider>

      <button className="bg-white text-black py-2 px-4 rounded-lg w-full hover:bg-gray-300 transition" onClick={() => setShowPopup(true)}>
        Transfer NFT
      </button>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-black p-6 rounded-lg shadow-lg w-96 text-white border border-gray-700 relative">
            <h2 className="text-xl font-bold mb-4 text-center">Transfer NFT</h2>

            <NFTProvider contract={contract} tokenId={tokenId}>
              <NFTMedia className="w-full h-48 object-cover rounded-md mb-4" />
              <NFTName className="text-lg font-semibold mb-2" />
            </NFTProvider>
            <input
              type="text"
              placeholder="Enter wallet address"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              className="border border-gray-600 bg-black p-2 mb-4 w-full rounded focus:outline-none focus:ring-2 focus:ring-white"
            />
            {type === "erc1155" && (
              <input
                type="number"
                placeholder="Enter quantity"
                max={balance}
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-gray-600 bg-black p-2 mb-4 w-full rounded focus:outline-none focus:ring-2 focus:ring-white"
              />
            )}
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
              <TransactionButton
                transaction={() =>
                  prepareContractCall({
                    contract,
                    method: type === "erc1155" ? "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)" : "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)",
                    params: type === "erc1155" ? [owner, transferAddress, tokenId, quantity, "0x"] : [owner, transferAddress, tokenId, "0x"],
                  })
                }
                onTransactionSent={(result) => console.log("Transaction submitted", result.transactionHash)}
                onTransactionConfirmed={(receipt) => alert("Transaction confirmed")}
                onError={(error) => console.error("Transaction error", error)}
                className="bg-white text-black py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Confirm Transfer
              </TransactionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
