"use client";

import React from "react";
import { useBillSplitter } from "./hooks/useBillSplitter";
import { InputView } from "./views/InputView";
import { ProcessingView } from "./views/ProcessingView";
import { EditorView } from "./views/EditorView";

export default function BillSplitter() {
  const {
    step,
    setStep,
    image,
    promptText,
    setPromptText,
    data,
    error,
    isDarkMode,
    toggleDarkMode,
    calculatedTotals,
    handleImageUpload,
    processReceipt,
    handleLoadMock,
    updateItemSplit,
    updateModifier,
    updateParticipantName,
    addParticipant,
    deleteParticipant,
    saveItem,
    deleteItem,
  } = useBillSplitter();

  if (step === "processing") {
    return <ProcessingView isDarkMode={isDarkMode} />;
  }

  if (step === "editor" && data) {
    return (
      <EditorView
        data={data}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onStartOver={() => setStep("input")}
        calculatedTotals={calculatedTotals}
        onUpdateParticipantName={updateParticipantName}
        onAddParticipant={addParticipant}
        onDeleteParticipant={deleteParticipant}
        onUpdateSplit={updateItemSplit}
        onUpdateModifier={updateModifier}
        onSaveItem={saveItem}
        onDeleteItem={deleteItem}
      />
    );
  }

  return (
    <InputView
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      image={image}
      handleImageUpload={handleImageUpload}
      promptText={promptText}
      setPromptText={setPromptText}
      error={error}
      processReceipt={processReceipt}
      handleLoadMock={handleLoadMock}
    />
  );
}
