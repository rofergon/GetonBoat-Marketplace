import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Upload, Plus, Image as ImageIcon } from "lucide-react";
import { useMintNFT } from "../../hooks/useMintNFT";
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
      toast.error("Por favor, selecciona una imagen");
      return;
    }

    try {
      await mintNFT(nftName, description, selectedFile);
      
      // Resetear el formulario
      setNftName("");
      setDescription("");
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Crear Nuevo NFT</h1>
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Detalles del NFT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nftName">Nombre</Label>
              <Input
                id="nftName"
                placeholder="Ingrese el nombre de su NFT"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describa su NFT"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Imagen</Label>
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
                        Seleccionar imagen
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
                "Procesando..."
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Crear y Mintear NFT
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
