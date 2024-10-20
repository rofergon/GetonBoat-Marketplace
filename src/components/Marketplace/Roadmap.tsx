import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface RoadmapItem {
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
}

interface RoadmapSection {
  title: string;
  items: RoadmapItem[];
}

const roadmapData: RoadmapSection[] = [
  {
    title: "Educational Zone",
    items: [
      { title: "Introduction to NFTs Guide", description: "Create educational content on the fundamentals of NFTs", status: 'in-progress' },
      { title: "Minting Tutorials", description: "Develop step-by-step tutorials on how to create and mint NFTs", status: 'planned' },
      { title: "Base Name Tutorials", description: "Create explanatory guides on the concept and use of Base Name in NFTs", status: 'planned' },
      { title: "Webinars with Established Artists", description: "Organize live sessions with successful artists in the NFT space", status: 'planned' },
      { title: "Digital Marketing Resources", description: "Provide guides on how to promote NFTs on social media", status: 'planned' },
      { title: "Mentorship Program", description: "Launch a mentorship program for emerging artists", status: 'planned' },
      { title: "Coworking Meetups", description: "Organize meetups in coworking spaces with local artists", status: 'planned' },
    ]
  },
  {
    title: "NFTs",
    items: [
      { title: "Initial Collection Launch", description: "Launch our first collection of exclusive NFTs", status: 'completed' },
      { title: "Integration with Popular Wallets", description: "Add support for MetaMask, WalletConnect, etc.", status: 'completed' },
      { title: "Implement Dynamic Minting", description: "Allow users to create their own NFTs on the platform", status: 'completed' },
      { title: "NFT Listing, Buying, and Selling", description: "Implement full functionality to list, buy, and sell NFTs on the platform", status: 'completed' },
      { title: "Pixel Art Animation Editor", description: "Implement an editor to create pixel art animations and convert them into NFTs", status: 'completed' },
      { title: "ERC-1155 Standard Integration", description: "Allow the creation of NFT copies and collections", status: 'planned' },
      { title: "Music NFT Section", description: "Add a dedicated section for music-based NFTs and audio files", status: 'planned' },
    ]
  },
  {
    title: "Auctions",
    items: [
      { title: "Basic Auction System", description: "Implement auction functionality for NFTs", status: 'in-progress' },
      { title: "Time-Limited Auctions", description: "Add countdown auctions", status: 'planned' },
      { title: "Silent Auctions", description: "Implement silent auction system", status: 'planned' },
    ]
  },
  {
    title: "DAO",
    items: [
      { title: "Governance Token Launch", description: "Create and distribute tokens for DAO governance", status: 'planned' },
      { title: "Proposal System", description: "Implement system for members to make and vote on proposals", status: 'planned' },
      { title: "Snapshot Integration", description: "Use Snapshot for off-chain voting", status: 'planned' },
    ]
  }
];

const Roadmap: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-background">
      <h2 className="text-3xl font-bold mb-8 text-center">Roadmap</h2>
      <div className="grid grid-cols-1 gap-6">
        {roadmapData.map((section, index) => (
          <Card key={index} className="bg-muted">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border-b border-background pb-2">
                  <span className={`text-xs font-medium px-2 py-1 mb-2 rounded-full ${
                    item.status === 'completed' ? 'bg-green-600 text-white' :
                    item.status === 'in-progress' ? 'bg-yellow-500 text-black' :
                    'bg-blue-500 text-white'
                  }`}>
                    {item.status === 'completed' ? 'Completed' :
                      item.status === 'in-progress' ? 'In Progress' :
                      'Planned'}
                  </span>
                  <h4 className="mt-1 font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;
