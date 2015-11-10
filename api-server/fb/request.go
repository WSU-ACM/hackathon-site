package fb

import (
	"net/http"
	"fmt"
	"io/ioutil"
	"encoding/json"
)

const facebookApiEndpoint = "https://graph.facebook.com/v2.5"
const Album2ID = "615849938471305"
const Album3ID = "855587011164262"


type Photo struct {
	Images []Image
	Picture string
}

type Image struct {
	Height int
	Source string
	Width int
}

type PhotoRequest struct {
	Data []*Photo
	Paging interface{}
}

func RequestFBAccessToken(secret string) string {
	resp, err := http.Get(facebookApiEndpoint + "/oauth/access_token?" +
					  "client_id=162401547444127" +
					  "&client_secret=" + secret +
					  "&grant_type=client_credentials")
	if err != nil {
		fmt.Println("fail")
		return ""
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Can't read no body")
		return ""
	}

	var f interface{}
	err = json.Unmarshal(body, &f)
	if err != nil {
		fmt.Println("Wat?!?")
		return ""
	}
	m := f.(map[string]interface{})
	return m["access_token"].(string)
}

func RequestPhotosForAlbum(accessToken string, albumID string) []*Photo {
	resp, err := http.Get(facebookApiEndpoint + "/" + albumID + "/photos?" +
						  "access_token=" + accessToken +
						  "&fields=images,picture")
	if err != nil {
		fmt.Println("Whoops! WTF happened?", err)

	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	var f PhotoRequest
	err = json.Unmarshal(body, &f)
	if err != nil {
		fmt.Println("ERROR BITCHES: ", err)
	}

	return f.Data
}
