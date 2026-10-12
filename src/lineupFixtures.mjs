// Deliberately fictional. These are NOT Qloo entities or taste signals.
export const lineupSample={
 title:"The Night Before the Festival",
 subtitle:"One artist cancels. Protect the shared cultural experience.",
 lineup:[
  {id:"artist:A",label:"Atlas Echo"},
  {id:"artist:B",label:"Blue Current"},
  {id:"artist:C",label:"Cinder Arcade"}
 ],
 candidatePool:[
  {id:"artist:D",label:"Dawn Frequency",organizerConfirmedAvailable:true},
  {id:"artist:E",label:"Electric Garden",organizerConfirmedAvailable:true}
 ],
 cancelledId:"artist:B",
 audienceRankings:[
  {id:"group:film",label:"Indie film crowd",
   orderedIds:["artist:A","artist:B","artist:C","artist:D","artist:E"]},
  {id:"group:electronic",label:"Electronic music crowd",
   orderedIds:["artist:D","artist:E","artist:C","artist:B","artist:A"]}
 ],
 protectedIds:["artist:A"],
 maxLossFromOriginal:.30
};
