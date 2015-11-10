package main

import "fmt"
import (
	"net/http"
	"io/ioutil"
	"encoding/json"
	"os"
	"strings"
	"./fb"
)

func main() {
	pServer := new(PhotoServer)
	pServer.serve()
}

type PhotoServer struct {
	fbAccessToken string
}

func (pServ *PhotoServer) serve() {
	file, err := os.Open("fb-client-secret")
	if err != nil {
		fmt.Println("Can't do shit", err)
		return
	}

	defer file.Close()
	secret, err := ioutil.ReadAll(file)
	pServ.fbAccessToken = fb.RequestFBAccessToken(strings.TrimSpace(string(secret)))

	println("Facebook access token: ", pServ.fbAccessToken)
	http.HandleFunc("/v1/photos/", pServ.servePhotos)
	if http.ListenAndServe(":4001", nil) != nil {
		fmt.Println("We aren't doing shit")
	}
}

func dumpJson(i interface{}) {
	out, _ := json.MarshalIndent(i, "", "  ")
	fmt.Println(string(out))
}


func (pServ *PhotoServer) servePhotos(w http.ResponseWriter, req *http.Request) {
	switch(req.URL.Path) {
	case "/v1/photos/2":
		fmt.Println("Photos year 2")
		photos := fb.RequestPhotosForAlbum(pServ.fbAccessToken, fb.Album2ID)
		writePhotos(photos, w)
	case "/v2/photos/3":
		fmt.Println("Photos year 3")
		photos := fb.RequestPhotosForAlbum(pServ.fbAccessToken, fb.Album3ID)
		writePhotos(photos, w)
	default:
		fmt.Println(req.URL.Path)
	}
}

func writePhotos(photos []*fb.Photo, w http.ResponseWriter) {
		response := make([]Photo, len(photos))
		for i, photo := range photos {
			response[i] = Photo {
				Link: photo.Images[0].Source,
				LinkMini: photo.Picture,
				Height: photo.Images[0].Height,
				Width: photo.Images[0].Width,
			}
		}
		jsonResp, _ := json.Marshal(response)
		w.Write(jsonResp)
}

type Photo struct {
	Link string `json:"link"`
	LinkMini string `json:"link_mini"`
	Height int `json:"height"`
	Width int	`json:"width"`
}
