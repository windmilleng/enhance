import { useState } from "react";
import Header from "../components/Header";
import styled from "styled-components";
import fetch from "isomorphic-unfetch";
import axios from "axios";
import UploadControl from "../components/UploadControl";
import ImageSelect from "../components/ImageSelect";
import ImageDisplay from "../components/ImageDisplay";
import Button from "../components/Button";

let Root = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

let MainPane = styled.main`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
`;

let ImageGrid = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
`;

let HistoryButtonContainer = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
`;

const Index = props => {
  const filters = props.filters;
  const defaultCheckedItems = props.defaultCheckedItems;

  const [historyImages, setHistoryImages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recentImages, setRecentImages] = useState(props.defaultImages);
  const [checkedItems, setCheckedItems] = useState(defaultCheckedItems);
  const [fileSelection, setFileSelection] = useState();
  const [resultingImage, setResultingImage] = useState("");
  const [applyState, setApplyState] = useState({
    inProgress: false,
    error: null
  });

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    fetch("/api/list")
      .then(res => res.json())
      .then(json => {
        let names = json.Names || [];
        if (names.length == 0) {
          setApplyState({ error: "No images in storage" });
          return;
        }

        reset();
        setHistoryImages(
          names.map(name => {
            return { url: `/api/image/${name}` };
          })
        );
        setShowHistory(true);
      })
      .catch(err => {
        setApplyState({ error: "Error fetching history: " + err });
      });
  };

  const selectImage = img => {
    let url = img.url;
    let blob = img.blob;
    let blobPromise = blob
      ? Promise.resolve(blob)
      : fetch(url).then(res => res.blob());

    blobPromise
      .then(blob => {
        img.blob = blob;

        // Append the image to the front of the recency list,
        // and remove it if it already exists in the list.
        let newRecentImages = [img].concat(
          recentImages.filter(existing => {
            return existing.url != url;
          })
        );
        setRecentImages(newRecentImages);
        setFileSelection(img);
        setShowHistory(false);
      })
      .catch(err => {
        setApplyState({ error: "Error fetching image: " + err });
        setShowHistory(false);
      });
  };

  const statusMessage = () => {
    if (applyState.inProgress) {
      return "Applying filter…";
    }

    if (applyState.error) {
      return applyState.error;
    }

    if (resultingImage || fileSelection) {
      return "Select one or more filters and apply";
    }

    return "Upload or Select an Image. Apply filters once selected";
  };

  const clearAndSetCheckedItems = checkedItems => {
    setResultingImage("");
    setCheckedItems(checkedItems);
    setApplyState({ inProgress: false, error: null });
  };

  const reset = () => {
    setShowHistory(false);
    setResultingImage("");
    setFileSelection(null);
    setCheckedItems(defaultCheckedItems);
    setApplyState({ inProgress: false, error: null });
  };

  const apply = async () => {
    if (!fileSelection) {
      throw new Error("internal error: no file to apply filters on");
    }

    const data = new FormData();
    const file = fileSelection.blob;
    data.append("file", file);
    const filters = Object.keys(checkedItems)
      .filter(key => checkedItems[key])
      .reduce((res, key) => ((res[key] = checkedItems[key]), res), {});
    data.append("filters", JSON.stringify(filters));
    setApplyState({ inProgress: true });

    axios
      .post("/api/upload", data, {})
      .then(response => {
        setResultingImage(response.data.name);
        setApplyState({ inProgress: false });
      })
      .catch(err => {
        setApplyState({ error: "Error applying filter: " + err });
      });
  };

  const renderContent = () => {
    if (resultingImage) {
      return <ImageDisplay src={`/api/image/${resultingImage}`} />;
    }

    if (fileSelection) {
      return (
        <ImageDisplay
          src={fileSelection.url}
          isPending={applyState.inProgress}
        />
      );
    }

    let cells = [];
    cells.push(
      <UploadControl key="upload-control" selectImage={selectImage} />
    );
    cells = cells.concat(
      recentImages.slice(0, 3).map((img, i) => {
        return (
          <ImageSelect key={"select" + i} img={img} selectImage={selectImage} />
        );
      })
    );

    if (showHistory) {
      cells = historyImages.slice(0, 10).map((img, i) => {
        return (
          <ImageSelect key={"select" + i} img={img} selectImage={selectImage} />
        );
      });
    }

    return <ImageGrid>{cells}</ImageGrid>;
  };

  return (
    <Root>
      <Header
        filters={filters}
        clearAndSetCheckedItems={clearAndSetCheckedItems}
        checkedItems={checkedItems}
        reset={reset}
        apply={apply}
        hasFileSelection={!!fileSelection}
        statusMessage={statusMessage()}
      />
      <MainPane>{renderContent()}</MainPane>
      <HistoryButtonContainer>
        <Button
          onClick={toggleHistory}
          isToggle={true}
          isYellow={true}
          selected={showHistory}
        >
          History
        </Button>
      </HistoryButtonContainer>
    </Root>
  );
};

Index.getInitialProps = async function() {
  const filtersData = await fetch("http://muxer:8080/filters").then(res =>
    res.json()
  );

  const staticImageUrls = ["/baby-bear.png", "/plane.png", "/duck.png"];
  let defaultImages = staticImageUrls.map(url => {
    return { url: url };
  });

  const defaultCheckedItems = {};
  filtersData.forEach(
    c => (defaultCheckedItems["filter_" + c.label.toLowerCase()] = false)
  );

  return {
    filters: filtersData,
    defaultCheckedItems: defaultCheckedItems,
    defaultImages: defaultImages
  };
};

export default Index;
