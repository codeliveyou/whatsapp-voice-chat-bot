import fs from 'fs'
import path from 'path'

export function deleteContent(directory) {
    fs.readdir(directory, (error, files) => {
      if (error) {
        console.error('Error reading the directory:', error);
        return;
      }
  
      files.forEach(file => {
        const filepath = path.join(directory, file);
  
        fs.stat(filepath, (error, stats) => {
          if (error) {
            console.error('Error reading the file:', error);
            return;
          }
  
          if (stats.isDirectory()) {
            deleteContent(filepath);
          } else {
            fs.unlink(filepath, error => {
              if (error) {
                console.error('Error deleting file:', error);
                return;
              }
            });
          }
        });
      });
    });
  }