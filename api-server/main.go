package main

import "fmt"
import (
	"./fb"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
)

func main() {
	pServer := new(PhotoServer)
	pServer.serve()
}

type PhotoServer struct {
	fbAccessToken string
}

type Photo struct {
	Link     string `json:"link"`
	LinkMini string `json:"link_mini"`
	Height   int    `json:"height"`
	Width    int    `json:"width"`
}

func (pServ *PhotoServer) serve() {
	file, err := os.Open("fb-client-secret")
	if err != nil {
		fmt.Fprintln(os.Stderr, "Can't open fb-client-secret", err)
		return
	}

	defer file.Close()
	secret, err := ioutil.ReadAll(file)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Unable to read the facebook client secret token", err)
		return
	}

	pServ.fbAccessToken, _ = fb.RequestFBAccessToken(strings.TrimSpace(string(secret)))

	http.HandleFunc("/v1/photos/", pServ.servePhotos)
	err = http.ListenAndServe(":4001", nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Unable to serve to port 4001", err)
	}
}

func (pServ *PhotoServer) servePhotos(w http.ResponseWriter, req *http.Request) {
	switch req.URL.Path {
	case "/v1/photos/2":
		photos, err := fb.RequestPhotosForAlbum(pServ.fbAccessToken, fb.Album2ID)
		if err == nil {
			writePhotos(photos, w)
		} else {
			fmt.Fprint(os.Stderr, err)
		}
	case "/v1/photos/3":
		photos, err := fb.RequestPhotosForAlbum(pServ.fbAccessToken, fb.Album3ID)
		if err == nil {
			writePhotos(photos, w)
		}
	default:
		fmt.Fprintln(os.Stderr, "Invalid url path: %s", req.URL.Path)
	}
}

func writePhotos(photos []*fb.Photo, w http.ResponseWriter) {
	response := make([]Photo, len(photos))
	for i, photo := range photos {
		response[i] = Photo{
			Link:     photo.Images[0].Source,
			LinkMini: photo.Picture,
			Height:   photo.Images[0].Height,
			Width:    photo.Images[0].Width,
		}
	}
	jsonResp, _ := json.Marshal(response)
	w.Write(jsonResp)
}

