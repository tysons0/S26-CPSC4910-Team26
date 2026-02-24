function OrganizationCard({ organization }) {
  return (
    <div className="sponsor-card">
      <div className="sponsor-image">
        <img src={sponsor.image} alt={sponsor.name} />
      </div>
      <div className="sponsor-info">
        <h3>{sponsor.name}</h3>
        <p>
          Apply to be sponsored by {sponsor.name} and earn exclusive rewards!
        </p>
        <div className="col action">
          <button className="linkish" type="button">
            Apply To Organization!
          </button>
        </div>
      </div>
    </div>
  );
}
export default OrganizationCard;
