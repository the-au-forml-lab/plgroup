#! /bin/sh

if [ $# -ne 2 ];
then
    echo "Usage: $0 <semester> <year>";
    exit 1;
fi

DOCS="docs";
OLD_DIR=$DOCS"/_past_semesters/"$YEAR"_"$SEM;

mkdir -p $OLD_DIR &&
cp $DOCS"/index.md" $OLD_DIR"/index.md" &&
mv $DOCS"/papers.md" $OLD_DIR"/papers.md" &&
[ ! -f $DOCS"/awards.md" ] || mv $DOCS"/awards.md" $OLD_DIR"/awards.md";

touch $DOCS"/papers.md";
