import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Upload, Plus, Image as ImageIcon } from "lucide-react";

export default function Create() {
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Aquí iría la lógica para crear la colección y subir la imagen
    console.log("Creando colección:", { collectionName, description, selectedFile });
    // Resetear el formulario
    setCollectionName("");
    setDescription("");
    setSelectedFile(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Crear Nueva Colección</h1>
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Detalles de la Colección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collectionName">Nombre de la Colección</Label>
              <Input
                id="collectionName"
                placeholder="Ingrese el nombre de su colección"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describa su colección"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Imagen de Portada</Label>
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
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Crear Colección
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Mis Colecciones</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Aquí irían las tarjetas de las colecciones creadas */}
          <Card>
            <CardHeader>
              <img
                alt="Colección de ejemplo"
                className="aspect-square object-cover rounded-lg"
                height="200"
                src="/placeholder.svg?height=200&width=200&text=Colección"
                width="200"
              />
            </CardHeader>
            <CardContent>
              <CardTitle>Colección de Ejemplo</CardTitle>
              <p className="text-sm text-muted-foreground">Creada el 01/01/2024</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Ver Detalles</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}