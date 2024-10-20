import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Upload, Plus, Image as ImageIcon } from "lucide-react";
import { useMintNFT } from "../../hooks/Marketplace/useMintNFT";
import { toast } from "react-hot-toast";

export default function Create() {
  const [nftName, setNftName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mintNFT, isMinting, isUploading, error } = useMintNFT();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }

    try {
      await mintNFT(nftName, description, selectedFile);
      
      // Reset the form
      setNftName("");
      setDescription("");
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New NFT</h1>
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>NFT Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nftName">Name</Label>
              <Input
                id="nftName"
                placeholder="Enter your NFT name"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your NFT"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label
                  htmlFor="image"
                  className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md hover:border-primary"
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                      <span className="mt-2 block text-sm font-medium text-muted-foreground">
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <span className="mt-2 block text-sm font-medium text-muted-foreground">
                        Select image
                      </span>
                    </div>
                  )}
                </Label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isMinting || isUploading}>
              {isMinting || isUploading ? (
                "Processing..."
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Create and Mint NFT
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
